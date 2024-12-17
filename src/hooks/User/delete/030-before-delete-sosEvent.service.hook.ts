import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { BeforeHookParams } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { SosEvent } from 'src/models/SosEvent';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from 'src/models/Notification';
@Injectable()
export class BeforeDeleteUser extends BaseHook {
  constructor(
    @InjectModel(SosEvent)
    private readonly sosEventModel: typeof SosEvent,
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
    transaction: Transaction,
  ): Promise<any> {
    if (previousData.data.primaryKey) {
      const findEvent = await this.sosEventModel.findAll({
        where: {
          userId: previousData.data.primaryKey,
        },
      });
      if (findEvent && findEvent.length) {
        await this.sosEventModel.destroy({
          where: {
            userId: previousData.data.primaryKey,
          },
          transaction,
        });
        for (const data of findEvent) {
          await this.notificationModel.destroy({
            where: {
              eventId: data.id,
            },
            transaction,
          });
        }
      }
      const findNotificationData = await this.notificationModel.findAll({
        where: {
          recipientId: Number(previousData.data.primaryKey),
        },
      });
      if (findNotificationData?.length) {
        await this.notificationModel.destroy({
          where: {
            recipientId: Number(previousData.data.primaryKey),
          },
          transaction,
        });
      }
    }
    return previousData;
  }
}
