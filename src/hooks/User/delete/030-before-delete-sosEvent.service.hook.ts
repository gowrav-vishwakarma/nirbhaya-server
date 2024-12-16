import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { BeforeHookParams } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { SosEvent } from 'src/models/SosEvent';
import { InjectModel } from '@nestjs/sequelize';
@Injectable()
export class BeforeDeleteUser extends BaseHook {
  constructor(
    @InjectModel(SosEvent)
    private readonly sosEventModel: typeof SosEvent,
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
      }
    }
    return previousData;
  }
}
