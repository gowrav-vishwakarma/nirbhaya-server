import { Injectable } from '@nestjs/common';
import { EventCount } from '../models/EventCount';
import { EventLog } from '../models/EventLog';
import { Op } from 'sequelize';
import * as randomstring from 'randomstring';
import { Capitalization } from 'randomstring';
@Injectable()
export class GlobalService {
  async updateEventCount(type: string, userId: number) {
    console.log('userId.............', type, userId);

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];

    try {
      const [record] = await EventCount.findOrCreate({
        where: {
          date: formattedDate,
        },
        defaults: {
          [type]: 0,
          createdAt: currentDate,
          date: new Date(formattedDate),
        },
      });

      const [eventLog] = await EventLog.findOrCreate({
        where: {
          date: formattedDate,
          eventType: type,
          userId: userId,
        },
        defaults: {
          date: new Date(formattedDate),
          userId: userId,
          eventType: type,
          count: 1,
        },
      });
      console.log('eventLog..........', eventLog);

      if (eventLog) {
        await eventLog.increment('count', { by: 1 });
      }
      return await record.increment({ [type]: 1 });
    } catch (error) {
      console.error('Error updating event count:', error);
      return null;
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
