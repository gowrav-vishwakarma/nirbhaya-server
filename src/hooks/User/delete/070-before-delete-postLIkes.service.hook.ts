import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { BeforeHookParams } from 'src/qnatk/src';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { InjectModel } from '@nestjs/sequelize';
import { PostLike } from 'src/models/PostLike';
@Injectable()
export class BeforeDeleteUser extends BaseHook {
  constructor(
    @InjectModel(PostLike)
    private readonly postLike: typeof PostLike,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
    transaction: Transaction | undefined,
  ): Promise<any> {
    if (previousData.data.primaryKey) {
      await this.postLike.destroy({
        where: {
          userId: Number(previousData.data.primaryKey),
        },
        transaction,
      });
    }
  }
}
