import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/models/User';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { AmbassadorDto } from './DTO/ambassador.dto';
import { ActionExecuteParams } from 'src/qnatk/src';
@Injectable()
export class AmbassadorPoint extends BaseHook {
  constructor() {
    super();
  }
  async execute(previousData: ActionExecuteParams<User, AmbassadorDto, any>) {}
}
