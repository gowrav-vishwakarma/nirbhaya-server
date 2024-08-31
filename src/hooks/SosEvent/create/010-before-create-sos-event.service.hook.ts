import { Injectable } from '@nestjs/common';
import { BeforeHookParams } from 'src/qnatk/src/dto/Hooks.dto';
import { NirbhayaQnatkControllerService } from 'src/nirbhaya-qnatk-controller.service';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';

@Injectable()
export class SosCreateHook extends BaseHook {
  priority = 1;
  constructor(
    private readonly nirbhayaQnatkControllerService: NirbhayaQnatkControllerService,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
  ): Promise<BeforeHookParams<any, any>> {
    console.log('previousData.files...........', previousData);

    if (previousData.data.location) {
      const location = {
        type: 'Point',
        coordinates: [
          previousData.data.location.longitude,
          previousData.data.location.latitude,
        ],
      };
      previousData.data.location = location;
    }

    return previousData;
  }
}
