import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { BeforeHookParams, HookContextType } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { UserLocation } from 'src/models/UserLocation';
import { InjectModel } from '@nestjs/sequelize';
@Injectable()
export class BeforeDeleteUser extends BaseHook {
  constructor(
    @InjectModel(UserLocation)
    private readonly userLocation: typeof UserLocation,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
    transaction: Transaction | undefined,
  ): Promise<any> {
    if (previousData.data.primaryKey) {
      const locationData = await this.userLocation.findAll({
        where: {
          id: Number(previousData.data.primaryKey),
        },
      });
      if (locationData) {
        await this.userLocation.destroy({
          where: {
            userId: Number(previousData.data.primaryKey),
          },
          transaction,
        });
      }
    }
  }
}
