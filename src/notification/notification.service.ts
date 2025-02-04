import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from '../models/Notification';
import { SosEvent } from '../models/SosEvent';
import { GlobalService } from 'src/global/global.service';
import { SosService } from '../sos/sos.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    private globalService: GlobalService,
    private readonly sosService: SosService,
    @InjectModel(SosEvent)
    private readonly sosEventModel: typeof SosEvent,
  ) {}

  async getNotifications(userId: number): Promise<any[]> {
    try {
      const notifications = await this.notificationModel.findAll({
        where: { recipientId: userId, status: ['sent', 'accepted'] },
        include: [
          {
            model: SosEvent,
            attributes: [
              'id',
              'location',
              'status',
              'threat',
              'contactsOnly',
              'createdAt',
            ],
            where: { status: 'active' },
          },
        ],
        order: [['createdAt', 'DESC']],
        group: ['eventId'],
        limit: 50,
      });

      return notifications.map((notification) => {
        const plainNotification = notification.get({ plain: true });
        if (plainNotification.sosEvent && plainNotification.sosEvent.location) {
          plainNotification.sosEvent.location = {
            type: 'Point',
            coordinates: plainNotification.sosEvent.location.coordinates,
          };
        }
        return plainNotification;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new HttpException(
        'Failed to fetch notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async acceptNotification(
    notificationId: number,
    userId: number,
  ): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      where: { id: notificationId, recipientId: userId, status: 'sent' },
      include: [{ model: SosEvent }],
    });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found or cannot be accepted',
      );
    }

    notification.status = 'accepted';
    await notification.save();

    if (notification.sosEvent) {
      notification.sosEvent.accepted += 1;
      await notification.sosEvent.save();
    }
    this.globalService.updateEventCount('sosAccepted', userId);

    return notification;
  }

  async discardNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    await this.notificationModel.update(
      { status: 'discarded' },
      { where: { id: notificationId, recipientId: userId } },
    );
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const count = await this.notificationModel.count({
        where: {
          recipientId: userId,
          status: 'sent',
        },
        include: [
          {
            model: SosEvent,
            where: { status: 'active' },
            required: true,
          },
        ],
        group: ['eventId'],
      });
      return count.length;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw new HttpException(
        'Failed to fetch unread notification count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async broadcastNotification(notificationId: number, byUserId: number) {
    try {
      // Find the notification with its associated SOS event
      const notification = await this.notificationModel.findOne({
        where: { id: notificationId },
        include: [
          {
            model: SosEvent,
            // Explicitly specify the attributes we need
            attributes: ['id', 'location', 'contactsOnly', 'status', 'userId'],
          },
        ],
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      if (!notification.sosEvent) {
        throw new HttpException(
          'No SOS event associated with this notification',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sosEvent = notification.sosEvent;

      if (!sosEvent.contactsOnly) {
        return {
          success: true,
          notifiedCount: 0,
          message: 'Already notified nearby volunteers',
        };
      }

      // Check if location exists and has valid coordinates
      if (
        !sosEvent.location?.coordinates ||
        sosEvent.location.coordinates.length !== 2 ||
        (sosEvent.location.coordinates[0] === 0 &&
          sosEvent.location.coordinates[1] === 0)
      ) {
        throw new HttpException(
          'Invalid or missing location coordinates for this SOS event.',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.sosEventModel.update(
        { contactsOnly: false },
        { where: { id: sosEvent.id } },
      );

      // Notify nearby users after updating the event
      const notifiedCount = await this.sosService.notifyNearbyUsers(
        sosEvent,
        true,
      );

      return {
        success: true,
        notifiedCount,
        message: `Successfully notified ${notifiedCount} new nearby users`,
      };
    } catch (error) {
      console.error('Error in broadcastNotification:', error);
      throw new HttpException(
        error.message || 'Failed to broadcast notification',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
