import { Injectable } from '@nestjs/common';
import { BaseHook } from '../qnatk/src/hooks/base-hook';
import { Hook } from '../qnatk/src';

@Hook('REMOVE ME')
@Injectable()
export class TODO extends BaseHook {
  async execute(previousData: any): Promise<any> {
    return previousData;
  }
}
