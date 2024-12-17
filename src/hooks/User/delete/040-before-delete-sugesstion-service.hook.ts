import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { BeforeHookParams } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { Suggestion } from 'src/models/Suggestion';
import { InjectModel } from '@nestjs/sequelize';
@Injectable()
export class BeforeDeleteUser extends BaseHook {
  constructor(
    @InjectModel(Suggestion)
    private readonly suggestionModel: typeof Suggestion,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
    transaction: Transaction,
  ): Promise<any> {
    if (previousData.data.primaryKey) {
      const findSug = await this.suggestionModel.findAll({
        where: {
          userId: Number(previousData.data.primaryKey),
        },
      });
      if (findSug && findSug.length) {
        await this.suggestionModel.destroy({
          where: {
            userId: Number(previousData.data.primaryKey),
          },
          transaction,
        });
      }
      return previousData;
    }
  }
}
