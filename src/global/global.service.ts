import { Injectable } from '@nestjs/common';
import { EventCount } from '../models/EventCount';
import { EventLog } from '../models/EventLog';
import { Op } from 'sequelize';
import * as randomstring from 'randomstring';
import { Capitalization } from 'randomstring';
@Injectable()
export class GlobalService {
  async updateEventCount(type: string, userId: number) {
    try {
      // Validate input parameters
      if (!type || !userId) {
        console.warn('Invalid input: type and userId are required');
        return null;
      }

      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];

      // Create or update EventLog
      const [eventLog, created] = await EventLog.findOrCreate({
        where: {
          date: formattedDate,
          eventType: type,
          userId: userId,
        },
        defaults: {
          date: currentDate,
          userId: userId,
          eventType: type,
          count: 1,
        },
      });

      // If the record already existed, increment the count
      if (!created) {
        await eventLog.increment('count', { by: 1 });
      }
      // Manage EventCount
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
}
