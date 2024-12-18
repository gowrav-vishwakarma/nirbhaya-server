import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { User } from 'src/models/User';
import { ActionExecuteParams } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { AmbassadorDto } from './DTO/ambassador.dto';
import { EventLog } from 'src/models/EventLog';
import { InjectModel } from '@nestjs/sequelize';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';
import { GlobalService } from 'src/global/global.service';
@Injectable()
export class EventLogForAmbassador extends BaseHook {
  constructor(
    @InjectModel(EventLog)
    private eventLogModel: typeof EventLog,
    private globalService: GlobalService,
  ) {
    super();
  }
  async execute(
    previousData: ActionExecuteParams<User, AmbassadorDto, any>,
    transaction: Transaction,
  ): Promise<any> {
    const { data } = previousData;
    if (!data.userId) {
      throw new ValidationException({
        userId: ['userId is required'],
      });
    }
    console.log('data...user..id', data.userId, data.referUserId);
    //for referAmbassador
    if (data.referUserId) {
      await this.globalService.updateEventCount(
        'referAmbassador',
        data.referUserId,
        null,
        transaction,
      );
    }
    //for becomeAmbassador
    const eventType = data.isAmbassador
      ? 'becomeAmbassador'
      : 'removeAmbassador';
    await this.globalService.updateEventCount(
      eventType,
      data.userId,
      null,
      transaction,
    );
  }
}
