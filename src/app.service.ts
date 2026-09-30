import { Injectable } from '@nestjs/common';
import { User } from './models/User';
import { Sequelize } from 'sequelize-typescript';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './sos/firebase.service';
import { SystemConfig } from './models/SystemConfig';
import { AppConfigService } from './app-config/app-config.service';

@Injectable()
export class AppService {
  private readonly notificationIntervalHours: number;
  private readonly LAST_NOTIFICATION_KEY = 'last_notification_run';

  constructor(
    private sequelize: Sequelize,
    private configService: ConfigService,
    private firebaseService: FirebaseService,
    private appConfigService: AppConfigService,
  ) {
    this.notificationIntervalHours =
      this.configService.get<number>('NOTIFICATION_INTERVAL_HOURS') || 6;
  }

  getHello(): string {
    return 'Hello World!';
  }

  checkVersion(currentVersion: string, deviceId: string) {
    console.log('currentVersion', currentVersion);
    return this.appConfigService.getVersionInfo(deviceId);
  }

  @Cron('0 */6 * * *', {
    name: 'sendPeriodicLikesAndCommentsNotification',
    timeZone: 'Asia/Kolkata',
  })
  async sendDailyLikesAndCommentsNotification() {
    const now = new Date();

    // Get last run time from database, default to 6 hours ago if not found
    let lastRun = new Date(
      now.getTime() - this.notificationIntervalHours * 60 * 60 * 1000,
    );
    const lastRunConfig = await SystemConfig.findOne({
      where: { key: this.LAST_NOTIFICATION_KEY },
    });
    if (lastRunConfig) {
      lastRun = new Date(lastRunConfig.value);
    }

    // Update last run time in database
    await SystemConfig.upsert({
      key: this.LAST_NOTIFICATION_KEY,
      value: now.toISOString(),
    });

    // Get users with their likes and comments counts since last run
    const usersWithActivity = (await User.findAll({
      attributes: [
        'id',
        'fcmToken',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM post_likes
            WHERE post_likes.postUserId = User.id
            AND post_likes.createdAt BETWEEN '${lastRun.toISOString()}' AND '${now.toISOString()}'
          )`),
          'likesCount',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM postComments
            WHERE postComments.postUserId = User.id
            AND postComments.createdAt BETWEEN '${lastRun.toISOString()}' AND '${now.toISOString()}'
          )`),
          'commentsCount',
        ],
      ],
      having: Sequelize.literal('likesCount > 0 OR commentsCount > 0'),
    })) as any;

    // Send notifications to each user
    for (const user of usersWithActivity) {
      const { likesCount, commentsCount } = user.get({ plain: true });

      if (user.fcmToken) {
        const timeRange = this.getTimeRangeString(lastRun, now);

        await this.sendNotification(
          user.fcmToken,
          `You received ${likesCount} likes and ${commentsCount} comments on your posts in the last ${timeRange}!`,
        );
      }
    }
  }

  private getTimeRangeString(start: Date, end: Date): string {
    const hours = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60),
    );
    return `${hours} hours`;
  }

  private async sendNotification(fcmToken: string, message: string) {
    console.log(`Sending notification to ${fcmToken}: ${message}`);
    await this.firebaseService.sendPushNotification(
      fcmToken,
      'New Activity', // title
      message, // body
      'none', // data
      'high', // priority
      true, // contentAvailable
    );
  }
}
