import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User';
import { UserLocation } from '../models/UserLocation';

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
    private readonly sequelize: Sequelize,
  ) {}

  async getLocationLeaderboard(
    userId: number,
    coordinates: [number, number],
    radius: number,
  ): Promise<LeaderboardEntry[]> {
    // Dummy data for now
    return [
      { id: userId, name: 'You', score: 120, isCurrentUser: true },
      { id: 2, name: 'John Doe', score: 150, isCurrentUser: false },
      { id: 3, name: 'Jane Smith', score: 130, isCurrentUser: false },
      { id: 4, name: 'Alice Johnson', score: 110, isCurrentUser: false },
      { id: 5, name: 'Bob Wilson', score: 90, isCurrentUser: false },
    ];
  }

  async getAdministrativeLeaderboard(
    userId: number,
    region: 'city' | 'state' | 'country',
    city?: string,
    state?: string,
  ): Promise<LeaderboardEntry[]> {
    // Dummy data with region-specific naming
    const regionName =
      region === 'city' ? city : region === 'state' ? state : 'India';

    return [
      {
        id: 2,
        name: `Top ${regionName} Helper`,
        score: 200,
        isCurrentUser: false,
      },
      { id: 3, name: `${regionName} Hero`, score: 180, isCurrentUser: false },
      { id: userId, name: 'You', score: 150, isCurrentUser: true },
      {
        id: 4,
        name: `${regionName} Volunteer 1`,
        score: 140,
        isCurrentUser: false,
      },
      {
        id: 5,
        name: `${regionName} Volunteer 2`,
        score: 130,
        isCurrentUser: false,
      },
    ];
  }

  async getUserReferralInfo(userId: number) {
    return {
      referralId: userId,
      peopleEncouraged: 5,
      locationsSecured: 3,
    };
  }
}
