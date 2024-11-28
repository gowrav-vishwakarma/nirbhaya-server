import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/models/User';
import { ActionExecuteParams } from 'src/qnatk/src';
import { AmbassadorDto } from './DTO/ambassador.dto';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';
import { Transaction } from 'sequelize';
@Injectable()
export class IsAmbassadorServiceHook extends BaseHook {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {
    super();
  }
  async execute(
    previousData: ActionExecuteParams<User, AmbassadorDto, any>,
    transaction: Transaction,
  ): Promise<any> {
    const { data } = previousData;
    previousData.data = await this.validateData(
      previousData.data,
      AmbassadorDto,
    );
    if (!previousData.data.userId) {
      throw new ValidationException({
        userId: ['userId is required'],
      });
    }
    if (data.ambassadorReferralId) {
      const referringUser = await this.userModel.findOne({
        where: { referralId: data.ambassadorReferralId },
      });
      if (!referringUser) {
        throw new ValidationException({
          ambassadorReferralId: ['Invalid referral ID'],
        });
      }
    }
    const updateData = {
      isAmbassador: data?.isAmbassador,
      linkedinId: data?.linkedin,
      twitterId: data?.twitter,
      facebookId: data?.facebook,
      instagramId: data?.instagram,
      youtubeId: data?.youtube,
      telegramId: data?.telegram,
      ambassadorReferralId: data?.ambassadorReferralId,
      ambassadorTimestamp: new Date().toISOString(),
    };
    console.log('updateData', updateData);
    await this.userModel.update(updateData, {
      where: {
        id: data.userId,
      },
      transaction,
    });
    console.log(previousData);
    return previousData;
  }
}
