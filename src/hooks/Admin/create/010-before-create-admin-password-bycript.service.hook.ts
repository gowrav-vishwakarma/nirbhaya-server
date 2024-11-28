import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
// import { Transaction } from 'sequelize';
import { BeforeHookParamsWithFiles } from 'src/qnatk/src/dto/Hooks.dto';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { Admin } from 'src/models/Admin';
import * as bcrypt from 'bcrypt';
@Injectable()
export class passwordBycript extends BaseHook {
  constructor(
    @InjectModel(Admin)
    private adminModel: typeof Admin,
  ) {
    super();
  }

  async execute(
    previousData: BeforeHookParamsWithFiles<any, any>,
  ): Promise<BeforeHookParamsWithFiles<any, any>> {
    if (previousData.data.password) {
      previousData.data.password = await bcrypt.hash(
        previousData.data.password,
        10,
      );
    }
    return previousData;
  }
}
