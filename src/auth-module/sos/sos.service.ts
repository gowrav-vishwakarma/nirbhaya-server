import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SosEvent } from 'src/models/SosEvent';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { Notification } from 'src/models/Notification';
import { Sequelize } from 'sequelize-typescript';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class SosService {
  constructor(
    @InjectModel(SosEvent) private readonly sosEventModel: typeof SosEvent,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    private sequelize: Sequelize,
    private firebaseService: FirebaseService,
  ) {}

  private readonly NEARBY_DISTANCE_METERS = 10000; // 1km radius

  async handleSos(sosEvent: SosEvent) {
    if (sosEvent.status === 'created') {
      return {
        message: 'SOS event created',
      };
    }
    if (sosEvent.escalationLevel === 0) {
      await this.initialEscalation(sosEvent);
    } else {
      await this.updateAcceptedCount(sosEvent);
    }

    return {
      informed: sosEvent.informed,
      accepted: sosEvent.accepted,
    };
  }

  private async initialEscalation(sosEvent: SosEvent) {
    await this.notifyNearbyUsers(sosEvent);
    await this.notifyEmergencyContacts(sosEvent);

    sosEvent.escalationLevel = 1;
    await sosEvent.save();
  }

  private async notifyNearbyUsers(sosEvent: SosEvent) {
    if (!sosEvent.location) {
      console.log('No location data for SOS event');
      return;
    }

    const [longitude, latitude] = sosEvent.location.coordinates;

    const nearbyUsers = await this.userModel.findAll({
      attributes: ['id', 'fcmToken'],
      where: Sequelize.literal(`ST_Distance_Sphere(
        point(${longitude}, ${latitude}),
        location
      ) <= ${this.NEARBY_DISTANCE_METERS}`),
      include: [
        {
          model: this.userModel.sequelize.models.UserLocation,
          as: 'locations',
          attributes: [],
          required: true,
        },
      ],
    });

    const notifications = nearbyUsers.map((user) => ({
      eventId: sosEvent.id,
      recipientId: user.id,
      recipientType: 'volunteer',
      status: 'sent',
    }));

    await this.notificationModel.bulkCreate(notifications as any);

    sosEvent.informed += nearbyUsers.length;
    sosEvent.escalationLevel = 1;
    await sosEvent.save();

    for (const user of nearbyUsers) {
      if (user.fcmToken) {
        await this.firebaseService.sendPushNotification(
          user.fcmToken,
          'SOS Alert',
          'Someone nearby needs help!',
          sosEvent.id.toString(),
          JSON.stringify(sosEvent.location.coordinates),
        );
      }
    }
  }

  private async notifyEmergencyContacts(sosEvent: SosEvent) {
    const emergencyContacts = await this.emergencyContactModel.findAll({
      where: { userId: sosEvent.userId },
      include: [
        {
          model: User,
          attributes: ['id', 'fcmToken'],
        },
      ],
    });

    const notifications = emergencyContacts.map((contact) => ({
      eventId: sosEvent.id,
      recipientId: contact.user.id,
      recipientType: 'emergency_contact',
      status: 'sent',
    }));

    await this.notificationModel.bulkCreate(notifications as any);

    sosEvent.informed += emergencyContacts.length;
    await sosEvent.save();

    for (const contact of emergencyContacts) {
      if (contact.user && contact.user.fcmToken) {
        await this.firebaseService.sendPushNotification(
          contact.user.fcmToken,
          'Emergency Alert',
          'Your emergency contact needs help!',
          sosEvent.id.toString(),
          JSON.stringify(sosEvent.location.coordinates),
        );
      }
    }
  }

  private async updateAcceptedCount(sosEvent: SosEvent) {
    const acceptedCount = await this.notificationModel.count({
      where: {
        eventId: sosEvent.id,
        status: 'accepted',
      },
    });

    sosEvent.accepted = acceptedCount;
    await sosEvent.save();
  }
}
