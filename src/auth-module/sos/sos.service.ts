import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SosEvent } from 'src/models/SosEvent';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { Notification } from 'src/models/Notification';
import { Sequelize } from 'sequelize-typescript';
import { FirebaseService } from 'src/firebase/firebase.service';
import { WebSocketGateway } from '@nestjs/websockets';
import { StreamingGateway } from '../../streaming/streaming.gateway';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@WebSocketGateway()
@Injectable()
export class SosService {
  private s3: S3Client;

  constructor(
    @InjectModel(SosEvent) private readonly sosEventModel: typeof SosEvent,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    private sequelize: Sequelize,
    private firebaseService: FirebaseService,
    private streamingGateway: StreamingGateway,
    private configService: ConfigService,
  ) {
    this.s3 = new S3Client({
      endpoint: this.configService.get('S3_ENDPOINT'),
      region: this.configService.get('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      },
    });
  }

  async getPresignedUrlForUpload(
    eventId: number,
    fileName: string,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.configService.get('S3_BUCKET'),
      Key: `sos/${eventId}/${fileName}`,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  private readonly NEARBY_DISTANCE_METERS = 1000; // 1km radius

  async handleSos(sosEvent: SosEvent) {
    if (sosEvent.status === 'created') {
      return {
        sosEventId: sosEvent.id,
        locationSentToServer: false,
        message: 'SOS event created',
        presignedUrl: sosEvent.presignedUrl,
      };
    }
    if (sosEvent.escalationLevel === 0) {
      const initialResult = await this.initialEscalation(sosEvent);
      sosEvent.informed += initialResult.informedCount; // Update informed count
    } else {
      const updateResult = await this.updateAcceptedCount(sosEvent);
      sosEvent.accepted = updateResult.acceptedCount; // Update informed count
    }

    return {
      sosEventId: sosEvent.id,
      informed: sosEvent.informed, // Use updated informed property
      accepted: sosEvent.accepted,
      presignedUrl: sosEvent.presignedUrl,
    };
  }

  private async initialEscalation(sosEvent: SosEvent) {
    let notifiedSomeone = false;
    let informedCount = 0; // Track informed count

    if (sosEvent.location && !sosEvent.contactsOnly) {
      const notifiedNearbyUsersCount = await this.notifyNearbyUsers(sosEvent);
      notifiedSomeone = notifiedSomeone || notifiedNearbyUsersCount > 0;
      informedCount += notifiedNearbyUsersCount; // Update informed count
    }

    const notifiedEmergencyContacts =
      await this.notifyEmergencyContacts(sosEvent);
    notifiedSomeone = notifiedSomeone || notifiedEmergencyContacts;

    if (notifiedSomeone) {
      sosEvent.escalationLevel = 1;
      await sosEvent.save();
    }

    return { informedCount }; // Return the informed count
  }

  private async notifyNearbyUsers(sosEvent: SosEvent): Promise<number> {
    if (!sosEvent.location) {
      console.log('No location data for SOS event');
      return 0; // Return 0 if no location
    }

    if (sosEvent.escalationLevel > 0) {
      return 0;
    }

    const [longitude, latitude] = sosEvent.location.coordinates;

    // Fetch emergency contacts to exclude them from notifications
    const emergencyContacts = await this.emergencyContactModel.findAll({
      where: { userId: sosEvent.userId },
      attributes: ['contactUserId'],
    });
    const emergencyContactIds = emergencyContacts.map(
      (contact) => contact.contactUserId,
    );

    // Add a default contact ID if the array is empty
    const contactIdsToExclude =
      emergencyContactIds.length > 0 ? emergencyContactIds : [0];

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
      ) <= ${this.NEARBY_DISTANCE_METERS} AND User.id != ${sosEvent.userId} AND User.id NOT IN (${contactIdsToExclude.join(',')})`), // Exclude emergency contacts or default ID
    });

    // Notify nearby users and count them
    let notifiedCount = 0;
    if (nearbyUsers.length > 0) {
      const notifications = nearbyUsers.map((user) => {
        const userLocation = user.locations[0];
        const distance = this.calculateDistance(
          sosEvent.location.coordinates,
          userLocation.location.coordinates,
        );

        notifiedCount++; // Increment notified count

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

      sosEvent.informed += notifiedCount; // Update informed count
      sosEvent.escalationLevel = 1;
      await sosEvent.save();

      for (const notification of notifications) {
        const user = nearbyUsers.find((u) => u.id === notification.recipientId);
        if (user && user.fcmToken) {
          const distanceMessage = `${Math.round(notification.distanceToEvent)} meters away from your ${notification.userLocationName}`;
          await this.firebaseService.sendPushNotification(
            user.fcmToken,
            `SOS Alert #${sosEvent.id}`,
            `Someone nearby needs help! ${distanceMessage}`,
            sosEvent.id.toString(),
            JSON.stringify(sosEvent.location.coordinates),
            { distanceMessage },
          );
        }
      }
    }

    return notifiedCount; // Return the count of notified users
  }

  private async notifyEmergencyContacts(sosEvent: SosEvent): Promise<boolean> {
    const emergencyContacts = await this.emergencyContactModel.findAll({
      where: { userId: sosEvent.userId },
      include: [
        {
          model: User,
          as: 'contactUser',
          attributes: ['id', 'fcmToken', 'name'],
        },
      ],
    });

    const victim = await this.userModel.findByPk(sosEvent.userId, {
      attributes: ['name'],
    });

    if (emergencyContacts.length > 0 && victim) {
      const notifications = emergencyContacts.map((contact) => ({
        eventId: sosEvent.id,
        recipientId: contact.contactUserId,
        recipientType: 'emergency_contact',
        status: 'sent',
        userLocationName: victim.name, // Use victim's name here
        userLocation: null, // Set to null as it's not needed
        distanceToEvent: null, // Set to null as it's not needed
      }));

      await this.notificationModel.bulkCreate(notifications as any);

      // sosEvent.informed += emergencyContacts.length;
      await sosEvent.save();

      for (const contact of emergencyContacts) {
        if (contact.contactUser && contact.contactUser.fcmToken) {
          await this.firebaseService.sendPushNotification(
            contact.contactUser.fcmToken,
            sosEvent.contactsOnly
              ? `Help Needed #${sosEvent.id}`
              : `Emergency Alert #${sosEvent.id}`,
            `${victim.name} needs help!`,
            sosEvent.id.toString(),
            JSON.stringify(sosEvent.location?.coordinates),
            {},
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
    return { acceptedCount };
  }

  async handleWebRTCSignaling(client: Socket, sosEventId: string, signal: any) {
    console.log(`Broadcasting WebRTC signal to room ${sosEventId}`);
    client.to(sosEventId).emit('webrtc_signal', { sosEventId, signal });
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
