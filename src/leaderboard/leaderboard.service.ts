import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { literal } from 'sequelize';
import { User } from '../models/User';
import { UserLocation } from '../models/UserLocation';
import { EventLog } from '../models/EventLog';

// Scoring weights
const WEIGHTS = {
  REFERRAL: 10, // Points per successful referral
  REFERRAL_LOCATION: 100, // Points per location added by referrals
  DAILY_APP_OPEN_SELF: 10, // Points per day for opening app
  DAILY_APP_OPEN_REFERRAL: 5, // Points per day for referrals opening app
  MAX_DAILY_POINTS: 30, // Max points per day from app opens
};

export interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  isCurrentUser: boolean;
  scoreBreakdown?: ScoreBreakdown;
}

export interface ScoreBreakdown {
  totalScore: number;
  referrals: {
    count: number;
    score: number;
  };
  referralLocations: {
    count: number;
    score: number;
  };
  selfActivity: {
    daysActive: number;
    score: number;
  };
  referralsActivity: {
    totalDaysActive: number;
    score: number;
  };
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,
    @InjectModel(EventLog)
    private readonly eventLogModel: typeof EventLog,
    private readonly sequelize: Sequelize,
  ) {}

  async getLocationLeaderboard(
    userId: number,
    coordinates: [number, number],
    radius: number,
  ): Promise<LeaderboardEntry[]> {
    const [longitude, latitude] = coordinates;

    // First get all userIds that have locations within the radius using ST_Distance_Sphere
    const [usersWithinRadius] = await this.sequelize.query(`
      SELECT DISTINCT ul.userId 
      FROM UserLocations ul
      WHERE ST_Distance_Sphere(
        ul.location,
        ST_GeomFromText('POINT(${longitude} ${latitude})')
      ) <= ${radius}
    `);

    const userIds = (usersWithinRadius as any[]).map((u) => u.userId);

    if (!userIds.length) {
      return [];
    }

    // Then get the leaderboard for these users
    const users = await this.userModel.findAll({
      where: {
        id: userIds,
      },
      attributes: [
        'id',
        'name',
        [literal(this.getScoreQuery()), 'score'],
        [
          literal('(SELECT COUNT(*) FROM Users WHERE referUserId = User.id)'),
          'referralCount',
        ],
        [
          literal(
            '(SELECT COUNT(*) FROM Users u INNER JOIN UserLocations ul ON ul.userId = u.id WHERE u.referUserId = User.id)',
          ),
          'referralLocationsCount',
        ],
        [
          literal(
            `(SELECT COUNT(DISTINCT date) FROM eventLog WHERE userId = User.id AND eventType = 'appOpen' AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY))`,
          ),
          'selfAppOpenDays',
        ],
        [
          literal(
            `COALESCE((SELECT SUM(daily_opens) FROM (SELECT COUNT(DISTINCT date) as daily_opens FROM eventLog WHERE userId IN (SELECT id FROM Users WHERE referUserId = User.id) AND eventType = 'app' AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY userId) as ref_opens), 0)`,
          ),
          'referralsAppOpenDays',
        ],
      ],
      order: [[literal('score'), 'DESC']],
      limit: 100,
    });

    return this.formatLeaderboardResults(users, userId);
  }

  async getAdministrativeLeaderboard(
    userId: number,
    region: 'city' | 'state' | 'country',
    city?: string,
    state?: string,
  ): Promise<LeaderboardEntry[]> {
    const where: any = {};
    if (region === 'city' && city) {
      where.city = city;
    } else if (region === 'state' && state) {
      where.state = state;
    }

    const users = await this.userModel.findAll({
      where,
      attributes: [
        'id',
        'name',
        [literal(this.getScoreQuery()), 'score'],
        [
          literal('(SELECT COUNT(*) FROM Users WHERE referUserId = User.id)'),
          'referralCount',
        ],
        [
          literal(
            '(SELECT COUNT(*) FROM Users u INNER JOIN UserLocations ul ON ul.userId = u.id WHERE u.referUserId = User.id)',
          ),
          'referralLocationsCount',
        ],
        [
          literal(
            `(SELECT COUNT(DISTINCT date) FROM eventLog WHERE userId = User.id AND eventType = 'appOpen' AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY))`,
          ),
          'selfAppOpenDays',
        ],
        [
          literal(
            `COALESCE((SELECT SUM(daily_opens) FROM (SELECT COUNT(DISTINCT date) as daily_opens FROM eventLog WHERE userId IN (SELECT id FROM Users WHERE referUserId = User.id) AND eventType = 'appOpen' AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY userId) as ref_opens), 0)`,
          ),
          'referralsAppOpenDays',
        ],
      ],
      order: [[literal('score'), 'DESC']],
      limit: 100,
    });

    return this.formatLeaderboardResults(users, userId);
  }

  private getScoreQuery(): string {
    return `
      /* Referral points */
      (SELECT COUNT(*) * ${WEIGHTS.REFERRAL} 
       FROM Users referrals 
       WHERE referrals.referUserId = User.id) +
      
      /* Referral locations points */
      (SELECT COUNT(*) * ${WEIGHTS.REFERRAL_LOCATION}
       FROM Users referrals 
       INNER JOIN UserLocations refLocs ON refLocs.userId = referrals.id
       WHERE referrals.referUserId = User.id) +
      
      /* Self daily app opens (last 30 days) */
      LEAST(
        (SELECT COUNT(DISTINCT date) * ${WEIGHTS.DAILY_APP_OPEN_SELF}
         FROM eventLog 
         WHERE userId = User.id 
         AND eventType = 'appOpen'
         AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ), ${WEIGHTS.MAX_DAILY_POINTS}
      ) +
      
      /* Referrals daily app opens (last 30 days) */
      COALESCE(
        (SELECT SUM(daily_points)
         FROM (
           SELECT 
             LEAST(COUNT(DISTINCT el.date) * ${WEIGHTS.DAILY_APP_OPEN_REFERRAL}, 
                   ${WEIGHTS.MAX_DAILY_POINTS}) as daily_points
           FROM Users refs
           LEFT JOIN eventLog el ON el.userId = refs.id
           WHERE refs.referUserId = User.id
           AND el.eventType = 'appOpen'
           AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           GROUP BY refs.id
         ) as referral_points
        ), 0
      )
    `;
  }

  private async getScoreBreakdown(userId: number): Promise<ScoreBreakdown> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [results] = await this.sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM Users WHERE referUserId = ${userId}) as referralCount,
        (SELECT COUNT(*) FROM Users u 
         INNER JOIN UserLocations ul ON ul.userId = u.id 
         WHERE u.referUserId = ${userId}) as referralLocationsCount,
        (SELECT COUNT(DISTINCT date) FROM eventLog 
         WHERE userId = ${userId} 
         AND eventType = 'appOpen'
         AND date >= '${thirtyDaysAgo.toISOString()}') as selfAppOpenDays,
        (SELECT 
           COUNT(DISTINCT refs.id) as referral_count,
           SUM(DISTINCT daily_opens) as total_days_active
         FROM Users refs
         LEFT JOIN (
           SELECT 
             userId,
             COUNT(DISTINCT date) as daily_opens
           FROM eventLog
           WHERE eventType = 'appOpen'
           AND date >= '${thirtyDaysAgo.toISOString()}'
           GROUP BY userId
         ) el ON el.userId = refs.id
         WHERE refs.referUserId = ${userId}
        ) as referral_activity
    `);

    const breakdown = results[0] as any;

    const referralScore = breakdown.referralCount * WEIGHTS.REFERRAL;
    const referralLocationsScore =
      breakdown.referralLocationsCount * WEIGHTS.REFERRAL_LOCATION;
    const selfAppOpenScore = Math.min(
      breakdown.selfAppOpenDays || 0 * WEIGHTS.DAILY_APP_OPEN_SELF,
      WEIGHTS.MAX_DAILY_POINTS,
    );
    const referralsAppOpenScore = Math.min(
      (breakdown.total_days_active || 0) * WEIGHTS.DAILY_APP_OPEN_REFERRAL,
      WEIGHTS.MAX_DAILY_POINTS,
    );

    return {
      totalScore:
        referralScore +
        referralLocationsScore +
        selfAppOpenScore +
        referralsAppOpenScore,
      referrals: {
        count: breakdown.referralCount || 0,
        score: referralScore,
      },
      referralLocations: {
        count: breakdown.referralLocationsCount || 0,
        score: referralLocationsScore,
      },
      selfActivity: {
        daysActive: breakdown.selfAppOpenDays || 0,
        score: selfAppOpenScore,
      },
      referralsActivity: {
        totalDaysActive: breakdown.total_days_active || 0,
        score: referralsAppOpenScore,
      },
    };
  }

  private formatLeaderboardResults(users: User[], currentUserId: number) {
    return users.map((user: any) => {
      const referralScore =
        user.getDataValue('referralCount') * WEIGHTS.REFERRAL;
      const referralLocationsScore =
        user.getDataValue('referralLocationsCount') * WEIGHTS.REFERRAL_LOCATION;
      const selfAppOpenScore = Math.min(
        user.getDataValue('selfAppOpenDays') * WEIGHTS.DAILY_APP_OPEN_SELF,
        WEIGHTS.MAX_DAILY_POINTS,
      );
      const referralsAppOpenScore = Math.min(
        user.getDataValue('referralsAppOpenDays') *
          WEIGHTS.DAILY_APP_OPEN_REFERRAL,
        WEIGHTS.MAX_DAILY_POINTS,
      );

      return {
        id: user.id,
        name: user.name,
        score: Math.round(Number(user.getDataValue('score')) || 0),
        isCurrentUser: user.id === currentUserId,
        scoreBreakdown: {
          totalScore: Math.round(Number(user.getDataValue('score')) || 0),
          referrals: {
            count: user.getDataValue('referralCount') || 0,
            score: referralScore,
          },
          referralLocations: {
            count: user.getDataValue('referralLocationsCount') || 0,
            score: referralLocationsScore,
          },
          selfActivity: {
            daysActive: user.getDataValue('selfAppOpenDays') || 0,
            score: selfAppOpenScore,
          },
          referralsActivity: {
            totalDaysActive: user.getDataValue('referralsAppOpenDays') || 0,
            score: referralsAppOpenScore,
          },
        },
      };
    });
  }

  async getUserReferralInfo(userId: number) {
    return {
      referralId: userId,
      peopleEncouraged: 5,
      locationsSecured: 3,
    };
  }
}
