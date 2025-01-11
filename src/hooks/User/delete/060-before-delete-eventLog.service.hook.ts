import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { BeforeHookParams } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { InjectModel } from '@nestjs/sequelize';
import { EventLog } from 'src/models/EventLog';
@Injectable()
export class BeforeDeleteUser extends BaseHook {
  constructor(
    @InjectModel(EventLog)
    private readonly eventLog: typeof EventLog,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
    transaction: Transaction | undefined,
  ): Promise<any> {
    if (previousData.data.primaryKey) {
      await this.eventLog.destroy({
        where: {
          userId: Number(previousData.data.primaryKey),
        },
        transaction,
      });
    }
    return previousData;
  }
}
