import { Injectable } from '@nestjs/common';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { BeforeHookParams } from 'src/qnatk/src/dto/Hooks.dto';
@Injectable()
export class BeforeDeleteExecuteHook extends BaseHook {
  constructor() {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
  ): Promise<BeforeHookParams<any, any>> {
    console.log('previousData...........', previousData);
    return previousData;
  }
}
