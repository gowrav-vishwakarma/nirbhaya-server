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

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    private globalService: GlobalService,
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
    await this.globalService.updateEventCount('sosAccepted');

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
}
