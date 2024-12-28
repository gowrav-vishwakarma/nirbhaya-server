import { Injectable } from '@nestjs/common';
import { User } from './models/User';
import { PostLike } from './models/PostLike';
import { PostComment } from './models/PostComment';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './sos/firebase.service';

@Injectable()
export class AppService {
  private lastRunTime: Date;
  private readonly notificationIntervalHours: number;

  constructor(
    private sequelize: Sequelize,
    private configService: ConfigService,
    private firebaseService: FirebaseService,
  ) {
    // Default to 6 hours if not configured
    this.notificationIntervalHours =
      this.configService.get<number>('NOTIFICATION_INTERVAL_HOURS') || 6;
    this.lastRunTime = new Date();
  }

  getHello(): string {
    return 'Hello World!';
  }

  checkVersion(currentVersion: string) {
    return {
      skipUpdate: false,
      latestVersion: '0.0.213',
      latestIosVersion: '0.0.213',
      latestAndroidVersion: '0.0.213',
      forceUpdate: false,
      minimumVersion: '0.0.213',
      androidUpdateUrl:
        'https://play.google.com/store/apps/details?id=com.xavoc.shoutout',
      iosUpdateUrl: 'https://apps.apple.com/app/6738719612',
    };
  }

  @Cron('0 */6 * * *', {
    name: 'sendPeriodicLikesAndCommentsNotification',
    timeZone: 'Asia/Kolkata',
  }) // Runs every 6 hours at IST
  async sendDailyLikesAndCommentsNotification() {
    const now = new Date();
    const lastRun = this.lastRunTime;

    // Update lastRunTime for next execution
    this.lastRunTime = now;

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
      '', // data
      'high', // priority
      true, // contentAvailable
    );
  }
}
