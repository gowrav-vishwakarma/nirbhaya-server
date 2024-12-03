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

@Injectable()
export class GlobalService {
  constructor(private sequelize: Sequelize) {}

  async updateEventCount(
    type: string,
    userId: number,
    isReferral?: boolean,
    referUserId?: number,
  ) {
    try {
      console.log('isReferral', isReferral);
      // Validate input parameters
      if (!type || !userId) {
        console.warn('Invalid input: type and userId are required');
        return null;
      }

      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];
      const defaults = {};
      defaults['date'] = currentDate;
      defaults['userId'] = userId;
      defaults['eventType'] = type;
      defaults['count'] = 1;

      const PointsRule = await PointsRulesEntity.findOne({
        attributes: ['points'],
        where: {
          actionType: type,
        },
      });
      if (PointsRule) {
        defaults['point'] = PointsRule?.points;
      }

      const updatePointsCondition = {};
      if (PointsRule) {
        if (referUserId) {
          updatePointsCondition['id'] = referUserId;
        } else {
          updatePointsCondition['id'] = userId;
        }
        await User.increment('point', {
          by: defaults['point'],
          where: updatePointsCondition,
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
      });

      // If the record already existed, increment the count
      if (!created) {
        await eventLog.increment('count', { by: 1 });
      }
      // Manage EventCount
      // &&
      //   [
      //     'registerUsers',
      //     'appOpen',
      //     'loginUsers',
      //     'sosEvents',
      //     'news',
      //     'registerVolunteers',
      //     'sosAccepted',
      //     'sosMovement',
      //     'sosHelp',
      //   ].includes(type)
      if (created) {
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

      // First get all emergency contacts where this user is listed
      const emergencyContacts = await EmergencyContact.findAll({
        where: {
          contactUserId: params.userId,
        },
      });

      // Extract the user IDs who listed this person as emergency contact
      const connectedUserIds = emergencyContacts.map(
        (contact) => contact.userId,
      );

      // Fetch SOS events for all connected users
      const sosEvents = await SosEvent.findAll({
        where: {
          userId: {
            [Op.in]: connectedUserIds,
          },
          status: 'resolved',
        },
        include: [
          {
            model: User,
            attributes: ['name'], // Include basic user info
          },
        ],
        order: [['createdAt', 'DESC']], // Most recent first
        limit: limit,
        offset: offset,
      });

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
        // await this.updateEventCount('referralGiver', receiverId, true, giverId);
        // await this.updateEventCount(
        //   'referralAcceptor',
        //   giverId,
        //   true,
        //   receiverId,
        // );
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
}
