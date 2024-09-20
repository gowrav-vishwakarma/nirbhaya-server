import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User';
import { UserLocation } from '../models/UserLocation';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,
    private readonly sequelize: Sequelize,
  ) {}

  async getUserReferralInfo(userId: number): Promise<any> {
    const referralCount = await this.userModel.count({
      where: { referUserId: userId },
    });

    const locationsSecured = await this.userLocationModel.count({
      include: [
        {
          model: User,
          where: { referUserId: userId },
        },
      ],
    });

    return {
      referralId: userId,
      peopleEncouraged: referralCount,
      locationsSecured,
    };
  }

  async getLeaderboard(limit: number = 10): Promise<any[]> {
    const users = await this.userModel.findAll({
      include: [
        {
          model: User,
          as: 'referrals',
          attributes: ['id'],
          include: [
            {
              model: UserLocation,
              attributes: ['id'],
            },
          ],
        },
      ],
      attributes: ['id', 'name', 'referralId'],
      order: [[this.sequelize.literal('referrals.length'), 'DESC']],
      limit,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      referralId: user.referralId,
      referralCount: user.referrals.length,
      locationsSecured: user.referrals.reduce(
        (total, referral) => total + referral.locations.length,
        0,
      ),
    }));
  }
}
