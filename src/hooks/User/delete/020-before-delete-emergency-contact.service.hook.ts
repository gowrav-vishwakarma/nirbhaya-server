import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { BeforeHookParams } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class BeforeDeleteEmergencyContactExecuteHook extends BaseHook {
  constructor(
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
    transaction: Transaction,
  ): Promise<any> {
    console.log('previos..data..', previousData.data);
    if (previousData.data.primaryKey) {
      const findContact = await this.emergencyContactModel.findAll({
        where: {
          userId: Number(previousData.data.primaryKey),
        },
      });
      if (findContact && findContact.length) {
        await this.emergencyContactModel.destroy({
          where: {
            userId: Number(previousData.data.primaryKey),
          },
          transaction,
        });
      }
      // remove from emergencyContacts of others also
      await this.emergencyContactModel.destroy({
        where: {
          contactUserId: Number(previousData.data.primaryKey),
        },
        transaction,
      });
    }
    return previousData;
  }
}
