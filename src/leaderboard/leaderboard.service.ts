import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { literal } from 'sequelize';
import { User } from '../models/User';
import { UserLocation } from '../models/UserLocation';
import { EventLog } from '../models/EventLog';

// Scoring weights
const WEIGHTS = {
  REFERRAL: 100, // Points per successful referral
  REFERRAL_LOCATION: 50, // Points per location added by referrals
  DAILY_APP_OPEN_SELF: 10, // Points per day for opening app
  DAILY_APP_OPEN_REFERRAL: 5, // Points per day for referrals opening app
  MAX_DAILY_POINTS: 30, // Max points per day from app opens
};

export interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  isCurrentUser: boolean;
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

    // Haversine formula for distance calculation
    const distanceFormula = `
      6371 * acos(
        cos(radians(${latitude})) * 
        cos(radians(ST_X(location))) * 
        cos(radians(ST_Y(location)) - radians(${longitude})) + 
        sin(radians(${latitude})) * 
        sin(radians(ST_X(location)))
      )
    `;

    const users = await this.userModel.findAll({
      include: [
        {
          model: UserLocation,
          where: literal(`${distanceFormula} <= ${radius}`),
          required: true,
        },
      ],
      attributes: ['id', 'name', [literal(this.getScoreQuery()), 'score']],
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
      attributes: ['id', 'name', [literal(this.getScoreQuery()), 'score']],
      order: [[literal('score'), 'DESC']],
      limit: 100,
    });

    return this.formatLeaderboardResults(users, userId);
  }

  private getScoreQuery(): string {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
         AND eventType = 'APP_OPEN'
         AND date >= '${thirtyDaysAgo.toISOString()}'
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
           AND el.eventType = 'APP_OPEN'
           AND el.date >= '${thirtyDaysAgo.toISOString()}'
           GROUP BY refs.id
         ) as referral_points
        ), 0
      )
    `;
  }

  private formatLeaderboardResults(users: User[], currentUserId: number) {
    return users.map((user: any) => ({
      id: user.id,
      name: user.name,
      score: Math.round(Number(user.getDataValue('score')) || 0),
      isCurrentUser: user.id === currentUserId,
    }));
  }

  async getUserReferralInfo(userId: number) {
    return {
      referralId: userId,
      peopleEncouraged: 5,
      locationsSecured: 3,
    };
  }
}
