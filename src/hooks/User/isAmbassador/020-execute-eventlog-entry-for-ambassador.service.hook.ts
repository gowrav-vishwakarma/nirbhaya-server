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
    // const eventLogs = [];
    //for referAmbassador
    if (data.referUserId) {
      // eventLogs.push({
      //   eventType: 'referAmbassador',
      //   userId: data.referUserId,
      //   referUserId: data.referUserId,
      // });

      await this.globalService.updateEventCount(
        'referAmbassador',
        data.referUserId,
        null,
        transaction,
        // eventLogs[i]?.isReferral,
        // eventLogs[i]?.referUserId,
      );
    }
    //for becomeAmbassador
    const eventType = data.isAmbassador
      ? 'becomeAmbassador'
      : 'removeAmbassador';
    // let isReferral = false;
    // if (data.ambassadorReferralId) {
    //   isReferral = true;
    // }
    // eventLogs.push({
    //   eventType: eventType,
    //   userId: data.userId,
    // });
    // console.log('eventLog', eventLogs);
    // for (let i = 0; i < eventLogs.length; i++) {
    await this.globalService.updateEventCount(
      eventType,
      data.userId,
      null,
      transaction,
      // eventLogs[i]?.isReferral,
      // data?.referUserId,
    );
    // }
  }
}
