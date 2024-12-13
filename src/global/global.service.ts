import { Injectable } from '@nestjs/common';
import { EventCount } from '../models/EventCount';
import { EventLog } from '../models/EventLog';
import { Op } from 'sequelize';
import * as randomstring from 'randomstring';
import { Capitalization } from 'randomstring';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { SosEvent } from 'src/models/SosEvent';
import { PointsRulesEntity } from 'src/models/PointsRulesEntity';
import { ReferralLog } from '../models/ReferralLog';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Notification } from 'src/models/Notification';
@Injectable()
export class GlobalService {
  constructor(private sequelize: Sequelize) {}

  async updateEventCount(
    type: string,
    userId: number,
    referUserId?: number,
    transaction?: Transaction,
  ) {
    try {
      // Validate input parameters
      if (!type || !userId) {
        console.warn('Invalid input: type and userId are required');
        return null;
      }

      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];
      const defaults = {
        date: currentDate,
        userId: userId,
        eventType: type,
        count: 1,
        point: 0,
      };

      // Get points rule for this action
      const pointsRule = await PointsRulesEntity.findOne({
        where: { actionType: type },
      });

      // Handle special cases for referral and ambassador
      if (type === 'referralGiver') {
        // Check if referrer and receiver are in same city
        const [referrer, receiver] = await Promise.all([
          User.findByPk(referUserId),
          User.findByPk(userId),
        ]);

        if (referrer?.city === receiver?.city) {
          defaults.point = pointsRule?.points || 10;
        } else {
          defaults.point = 0; // No points if different cities
        }
      } else if (type === 'referAmbassador') {
        defaults.point = pointsRule?.points;
      } else if (pointsRule) {
        defaults.point = pointsRule.points;
      }

      // Update user points if applicable
      console.log('defaults.point', defaults.point);
      if (defaults.point > 0) {
        const targetUserId = referUserId || userId;
        await User.increment('point', {
          by: Number(defaults.point),
          where: { id: targetUserId },
          transaction,
        });
      }
      // Create or update EventLog
      const [eventLog, created] = await EventLog.findOrCreate({
        where: {
          date: formattedDate,
          eventType: type,
          userId: userId,
        },
        defaults: defaults,
        transaction,
      });

      // If the record already existed, increment the count
      if (!created) {
        await eventLog.increment('count', { by: 1, transaction });
      }
      // Manage EventCount

      if (
        created &&
        [
          'registerUsers',
          'appOpen',
          'loginUsers',
          'sosEvents',
          'news',
          'registerVolunteers',
          'sosAccepted',
          'sosMovement',
          'sosHelp',
          'becomeAmbassador',
          'removeAmbassador',
        ].includes(type)
      ) {
        const [eventCountRecord] = await EventCount.findOrCreate({
          where: { date: formattedDate },
          defaults: {
            [type]: 1,
            createdAt: currentDate,
            date: currentDate,
          },
        });

        await eventCountRecord.increment({ [type]: 1 });

        return eventCountRecord;
      }
      return true;
    } catch (error) {
      console.error('Error in updateEventCount:', error);
      throw error; // Re-throw to allow caller to handle the error
    }
  }

  async getDashboardData() {
    const userCountData = 3;
  }

  generateRandomString(
    length: number = 13,
    charset: string = 'hex',
    capitalization: Capitalization = 'uppercase',
  ): string {
    return randomstring.generate({
      length,
      charset,
      capitalization,
    });
  }

  async getContactSOSEvents(params) {
    try {
      const limit = params.limit || 10;
      const offset = params.offset || 0;

      console.log('service..1', params);
      console.log('query start..........');
      const sosEvents = await SosEvent.findAll({
        include: [
          {
            model: User,
            attributes: ['name'], // Include basic user info
          },
          {
            model: Notification,
            as: 'notifications',
            attributes: ['id'], // Include basic user info
            where: {
              recipientId: params.userId,
              recipientType: 'emergency_contact',
            },
          },
        ],
        order: [['createdAt', 'DESC']], // Most recent first
        limit: limit,
        offset: offset,
      });
      console.log('query end..........');

      console.log('service..2', sosEvents);
      return sosEvents;
    } catch (error) {
      console.error('Error fetching SOS events:', error);
      throw error;
    }
  }

  async createReferralEntry(receiverId: number, giverId: number) {
    const t = await this.sequelize.transaction();

    try {
      const currentDate = new Date();
      const dateOnly = currentDate.toISOString().split('T')[0];

      // Create entry in ReferralLog within transaction
      const referralEntry = await ReferralLog.create(
        {
          receiverId,
          giverId,
          date: dateOnly,
        },
        { transaction: t },
      );

      if (referralEntry) {
        console.log('referralEntry', referralEntry);
        await this.updateEventCount('referralGiver', receiverId, giverId);
        await this.updateEventCount('referralAcceptor', giverId, receiverId);
      }

      await t.commit();
      return referralEntry;
    } catch (error) {
      await t.rollback();
      console.error('Error in createReferralEntry:', error);
      throw error;
    }
  }

  // referral logic

  async getEventLogCounts(
    limit: number,
    offset: number,
    startDate?: string,
    endDate?: string,
    eventType?: string,
    groupByDate?: boolean,
  ) {
    try {
      const whereCondition: any = {};
      let groupByCondition = ['eventType'];

      if (groupByDate) {
        groupByCondition = ['eventType', 'date'];
      }

      if (startDate && endDate) {
        whereCondition.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      } else {
        // Default to today's date if no date range is provided
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        whereCondition.date = {
          [Op.between]: [startOfDay, endOfDay],
        };
      }

      // Only add eventType to whereCondition if it's not 'all'
      if (eventType && eventType !== 'all') {
        whereCondition.eventType = eventType;
      }

      const eventCounts = await EventLog.findAll({
        attributes: [
          'eventType',
          'date',
          [Sequelize.fn('SUM', Sequelize.col('count')), 'totalCount'],
        ],
        group: groupByCondition,
        limit: limit ? limit : undefined,
        offset: offset ? offset : undefined,
        where: whereCondition,
      });

      return eventCounts;
    } catch (error) {
      console.error('Error fetching event log counts:', error);
      throw error;
    }
  }
}
