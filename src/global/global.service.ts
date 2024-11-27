import { Injectable } from '@nestjs/common';
import { EventCount } from '../models/EventCount';
import { Op } from 'sequelize';
import * as randomstring from 'randomstring';
import { Capitalization } from 'randomstring';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { SosEvent } from 'src/models/SosEvent';
@Injectable()
export class GlobalService {
  async updateEventCount(type: string) {
    console.log(type);

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

  async getContactSOSEvents(params) {
    try {
      const page = params.page || 1;
      const perPage = params.perPage || 10;
      const offset = (page - 1) * perPage;
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
        limit: perPage,
        offset: offset,
      });

      console.log('service..2', sosEvents);
      return sosEvents;
    } catch (error) {
      throw error;
      return null;
    }
  }
}
