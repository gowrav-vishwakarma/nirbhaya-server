import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SosEvent } from 'src/models/SosEvent';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { Notification } from 'src/models/Notification';
import { Sequelize } from 'sequelize-typescript';
import { FirebaseService } from 'src/sos/firebase.service';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UserJWT } from 'src/dto/user-jwt.dto';
import { StreamingGateway } from 'src/streaming/streaming.gateway';
import { Op } from 'sequelize';
import * as moment from 'moment';
import { Feedback } from 'src/models/Feedback';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class SosService {
  private s3: S3Client | null = null;

  constructor(
    @InjectModel(SosEvent) private readonly sosEventModel: typeof SosEvent,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    @InjectModel(Feedback)
    private readonly feedbackModel: typeof Feedback,
    private sequelize: Sequelize,
    private firebaseService: FirebaseService,
    private streamingGateway: StreamingGateway,
    private configService: ConfigService,
    private globalService: GlobalService,
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

  async sosUpdate(data: any, user: UserJWT): Promise<any> {
    try {
      console.log('data...........', data);

      const location = data.location
        ? {
            type: 'Point',
            coordinates: [data.location.longitude, data.location.latitude],
          }
        : {
            type: 'Point',
            coordinates: [0, 0],
          };

      let sosEvent;

      if (data.status == 'created') {
        // cancel existing sos events for the same user
        await this.sosEventModel.update(
          { status: 'cancelled' },
          {
            where: {
              userId: user.id,
              status: ['active', 'created'],
            },
          },
        );
        sosEvent = await this.sosEventModel.create({
          location: location ? location : null,
          userId: user.id,
          status: 'active',
          threat: data.threat,
          informed: 0,
          accepted: 0,
          contactsOnly: data.contactsOnly || false,
          escalationLevel: 0,
        });
        this.globalService.updateEventCount('sosEvents');
      } else {
        sosEvent = await this.sosEventModel.findOne({
          where: { userId: user.id, status: 'active' },
        });

        // If updateNearbyAlso is true, temporarily override contactsOnly
        const shouldNotifyNearby = data.updateNearbyAlso === true;
        const originalContactsOnly = sosEvent.contactsOnly;

        const formatedSosData = {
          location: location || sosEvent.location,
          threat: data.threat || sosEvent.threat,
          status: data.status || sosEvent.status,
          contactsOnly: shouldNotifyNearby
            ? false
            : data.contactsOnly || sosEvent.contactsOnly,
        };

        await sosEvent.update(formatedSosData);

        if (data.status == 'cancelled') {
          await this.notificationModel.update(
            {
              status: 'discarded',
            },
            {
              where: {
                eventId: data.sosEventId,
              },
            },
          );
        }

        Object.assign(sosEvent, formatedSosData);
        await sosEvent.save();

        // Restore original contactsOnly value after notifications are sent
        if (shouldNotifyNearby) {
          await sosEvent.update({ contactsOnly: originalContactsOnly });
        }
        return await this.handleSos(sosEvent);
        // return result;
      }

      if (!sosEvent.location || sosEvent.location.coordinates[0] == 0) {
        return {
          sosEventId: sosEvent.id,
          locationSentToServer: false,
          informed: 0,
          accepted: 0,
          presignedUrl: sosEvent.presignedUrl,
        };
      }

      // Call sosService.handleSos with the new or updated SOS event
      return await this.handleSos(sosEvent);
    } catch (error) {
      console.error('Error in sosLocationCrud:', error);
      throw new Error('Failed to process SOS location');
    }
  }

  async getPresignedUrlForUpload(
    eventId: number,
    fileName: string,
    contentType: string,
  ): Promise<string> {
    if (!this.s3) {
      return '';
    }
    const key = `sos/${new Date().toISOString().split('T')[0]}/${eventId}/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.configService.get('S3_BUCKET'),
      Key: key,
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

  private async notifyNearbyUsers(
    sosEvent: SosEvent,
    force: boolean = false,
  ): Promise<number> {
    if (!sosEvent.location) {
      console.log('No location data for SOS event');
      return 0;
    }

    if (!force && sosEvent.escalationLevel > 0) {
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

  async getSOSEvents(
    eventType: string,
    timeRange: string,
    latitude: number,
    longitude: number,
    radius: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    try {
      const whereClause: any = {};

      if (eventType !== 'all') {
        whereClause.status = eventType;
      }

      if (timeRange !== 'live') {
        const timeRangeFilter = this.getTimeRangeFilter(
          timeRange,
          startDate,
          endDate,
        );
        if (timeRangeFilter) {
          whereClause.createdAt = timeRangeFilter;
        }
      }

      whereClause[Op.and] = [
        Sequelize.where(
          Sequelize.fn(
            'ST_Distance_Sphere',
            Sequelize.col('location'),
            Sequelize.fn('ST_GeomFromText', `POINT(${longitude} ${latitude})`),
          ),
          {
            [Op.lte]: radius,
          },
        ),
      ];

      const events = await this.sosEventModel.findAll({
        where: whereClause,
        attributes: ['id', 'location', 'status', 'threat', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 1000,
      });

      return events.map((event) => {
        const plainEvent = event.get({ plain: true });
        if (plainEvent.location) {
          plainEvent.location = {
            type: 'Point',
            coordinates: plainEvent.location.coordinates,
          };
        }
        return plainEvent;
      });
    } catch (error) {
      console.error('Error fetching SOS events:', error);
      throw new HttpException(
        'Failed to fetch SOS events',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getTimeRangeFilter(
    timeRange: string,
    startDate?: string,
    endDate?: string,
  ) {
    const now = moment();
    switch (timeRange) {
      case 'last3Hours':
        return { [Op.gte]: now.subtract(3, 'hours').toDate() };
      case 'today':
        return { [Op.gte]: now.startOf('day').toDate() };
      case 'last2Days':
        return { [Op.gte]: now.subtract(2, 'days').startOf('day').toDate() };
      case 'last7Days':
        return { [Op.gte]: now.subtract(7, 'days').startOf('day').toDate() };
      case 'last30Days':
        return { [Op.gte]: now.subtract(30, 'days').startOf('day').toDate() };
      case 'custom':
        if (startDate && endDate) {
          return { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }
        return null;
      default:
        return null;
    }
  }

  async sosHstory(data: any): Promise<any> {
    const sosAccepted = await this.sosEventModel.findAll({
      attributes: ['id', 'threat', 'status', 'createdAt', 'location'],
      where: {
        userId: data.userId,
        // status: 'resolved',
        ...(data.eventId ? { id: data.eventId } : {}),
      },
      order: [['createdAt', 'DESC']], // Added order to get latest first
    });
    return sosAccepted;
  }
  async getNotificationsByUserId(data: any): Promise<any> {
    console.log('data..........', data);

    const sosAccepted = await this.sosEventModel.findAll({
      attributes: ['id', 'threat', 'status', 'createdAt', 'location'],
      include: [
        {
          model: this.notificationModel,
          as: 'notifications',
          required: true,
          where: {
            status: 'accepted',
            eventId: data.eventId,
          },
          include: [
            {
              model: this.userModel,
              as: 'recipient',
              attributes: ['id', 'referralId'],
              include: [
                {
                  model: this.feedbackModel,
                  as: 'receivedFeedbacks',
                  attributes: [
                    'rating',
                    'feedbackText',
                    'responseTime',
                    'status',
                  ],
                  where: {
                    eventId: data.eventId,
                  },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      where: {
        userId: data.userId,
        status: 'resolved',
        ...(data.eventId ? { id: data.eventId } : {}),
      },
    });
    return sosAccepted;
  }

  async createAndUpdateFeedback(feedbackData: any) {
    try {
      const { feedbackGiverId, feedbackReceiverId, eventId } = feedbackData;
      const existingFeedback = await this.feedbackModel.findOne({
        where: {
          feedbackGiverId: feedbackGiverId, // This is undefined
          feedbackReceiverId: feedbackReceiverId,
          eventId: eventId,
        },
      });

      if (existingFeedback) {
        await existingFeedback.update(feedbackData);
        return existingFeedback; // Return the updated feedback
      } else {
        const feedback = await this.feedbackModel.create({
          ...feedbackData,
        });

        await this.notificationModel.update(
          {
            feedbackAdded: true,
          },
          {
            where: {
              recipientId: feedbackReceiverId,
              eventId: eventId,
            },
          },
        );
        return feedback;
      }
    } catch (error) {
      console.error('Error creating or updating feedback:', error);
      // throw new HttpException('Failed to create or update feedback');
    }
  }

  async FeedBackList(feedbackData: any) {
    try {
      const { userId } = feedbackData;
      const userFeedBack = await this.feedbackModel.findAll({
        where: {
          feedbackGiverId: userId,
        },
        include: [
          {
            model: User,
            as: 'feedbackReceiver',
            attributes: ['id', 'referralId'],
          },
          {
            model: SosEvent,
            as: 'sosEvent',
            attributes: ['id', 'threat', 'status', 'createdAt', 'location'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'referralId'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
      return userFeedBack;
    } catch (error) {
      console.error('Error fetching feedback list:', error);
      throw new HttpException(
        'Failed to fetch feedback list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getTrustStats() {
    try {
      // Get total number of users
      const totalVolunteers = await this.userModel.count();

      return {
        totalVolunteers,
      };
    } catch (error) {
      console.error('Error getting trust stats:', error);
      throw new error(error);
    }
  }
  async getCurrentEventList(data: any): Promise<any> {
    console.log('call getCurrentEventList', data);
    const CurrentSOSEventList = await this.sosEventModel.findAll({
      attributes: ['id', 'status', 'createdAt'],
      where: {
        ...(data.userId ? { userId: data.userId } : {}),
        ...(data.eventId ? { id: data.eventId } : {}),
        status: ['cancelled', 'resolved'],
      },
    });
    return CurrentSOSEventList;
  }
}
