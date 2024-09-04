import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SosEvent } from 'src/models/SosEvent';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { Notification } from 'src/models/Notification';
import { Sequelize } from 'sequelize-typescript';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StreamingGateway } from '../../streaming/streaming.gateway';

@WebSocketGateway()
@Injectable()
export class SosService {
  private rooms: Map<string, Set<string>> = new Map();

  constructor(
    @InjectModel(SosEvent) private readonly sosEventModel: typeof SosEvent,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    private sequelize: Sequelize,
    private firebaseService: FirebaseService,
    @Inject(forwardRef(() => StreamingGateway))
    private streamingGateway: StreamingGateway,
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
    let notifiedSomeone = false;

    if (sosEvent.location) {
      const notifiedNearbyUsers = await this.notifyNearbyUsers(sosEvent);
      notifiedSomeone = notifiedSomeone || notifiedNearbyUsers;
    }

    const notifiedEmergencyContacts =
      await this.notifyEmergencyContacts(sosEvent);
    notifiedSomeone = notifiedSomeone || notifiedEmergencyContacts;

    if (notifiedSomeone) {
      sosEvent.escalationLevel = 1;
      await sosEvent.save();
    }
  }

  private async notifyNearbyUsers(sosEvent: SosEvent): Promise<boolean> {
    if (!sosEvent.location) {
      console.log('No location data for SOS event');
      return false;
    }

    const [longitude, latitude] = sosEvent.location.coordinates;

    const nearbyUsers = await this.userModel.findAll({
      attributes: ['id', 'fcmToken'],
      include: [
        {
          model: this.userModel.sequelize.models.UserLocation,
          as: 'locations',
          attributes: ['name', 'location'],
          required: true,
        },
      ],
      where: Sequelize.literal(`ST_Distance_Sphere(
        point(${longitude}, ${latitude}),
        location
      ) <= ${this.NEARBY_DISTANCE_METERS}`),
    });

    if (nearbyUsers.length > 0) {
      const notifications = nearbyUsers.map((user) => {
        const userLocation = user.locations[0];
        const distance = this.calculateDistance(
          sosEvent.location.coordinates,
          userLocation.location.coordinates,
        );

        return {
          eventId: sosEvent.id,
          recipientId: user.id,
          recipientType: 'volunteer',
          status: 'sent',
          userLocationName: userLocation.name,
          userLocation: userLocation.location,
          distanceToEvent: distance,
        };
      });

      await this.notificationModel.bulkCreate(notifications as any);

      sosEvent.informed += nearbyUsers.length;
      sosEvent.escalationLevel = 1;
      await sosEvent.save();

      for (const notification of notifications) {
        const user = nearbyUsers.find((u) => u.id === notification.recipientId);
        if (user && user.fcmToken) {
          const distanceMessage = `${Math.round(notification.distanceToEvent)} meters away from your ${notification.userLocationName}`;
          await this.firebaseService.sendPushNotification(
            user.fcmToken,
            'SOS Alert #' + sosEvent.id,
            `Someone nearby needs help! ${distanceMessage}`,
            sosEvent.id.toString(),
            JSON.stringify(sosEvent.location.coordinates),
            { distanceMessage },
          );
        }
      }

      return true;
    }

    return false;
  }

  private async notifyEmergencyContacts(sosEvent: SosEvent): Promise<boolean> {
    const emergencyContacts = await this.emergencyContactModel.findAll({
      where: { userId: sosEvent.userId },
      include: [
        {
          model: User,
          attributes: ['id', 'fcmToken'],
        },
      ],
    });

    if (emergencyContacts.length > 0) {
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
            JSON.stringify(sosEvent.location?.coordinates),
          );
        }
      }

      return true;
    }

    return false;
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

  async handleWebRTCSignaling(client: Socket, sosEventId: string, signal: any) {
    console.log(`Broadcasting WebRTC signal to room ${sosEventId}`);
    client.to(sosEventId).emit('webrtc_signal', { sosEventId, signal });
  }

  async joinSosRoom(client: Socket, sosEventId: string) {
    if (!this.rooms.has(sosEventId)) {
      this.rooms.set(sosEventId, new Set());
    }
    this.rooms.get(sosEventId)!.add(client.id);
    client.join(sosEventId);
    console.log(`Client ${client.id} joined room ${sosEventId}`);
  }

  async leaveSosRoom(client: Socket, sosEventId: string) {
    if (this.rooms.has(sosEventId)) {
      this.rooms.get(sosEventId)!.delete(client.id);
      if (this.rooms.get(sosEventId)!.size === 0) {
        this.rooms.delete(sosEventId);
      }
    }
    client.leave(sosEventId);
    console.log(`Client ${client.id} left room ${sosEventId}`);
  }

  async broadcastAudioData(sosEventId: string, audioData: string) {
    console.log(`Broadcasting audio data to room ${sosEventId}`);
    this.streamingGateway.server
      .to(sosEventId)
      .emit('audio_data', { audioData });
  }

  private calculateDistance(coord1: number[], coord2: number[]): number {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
