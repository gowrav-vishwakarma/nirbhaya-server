import { Injectable, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NirbhayaQnatkService } from './nirbhaya-qnatk.service';
import {
  ActionListDTO,
  HooksService,
  QnatkControllerService,
} from './qnatk/src';

@Injectable()
export class NirbhayaQnatkControllerService extends QnatkControllerService {
  constructor(
    protected readonly qnatkService: NirbhayaQnatkService, // Assuming QnatkService is injectable and used in the base class
    protected readonly hooksService: HooksService, // Assuming HooksService is injectable and used in the base class
    @InjectConnection('default') protected sequelize: Sequelize, // Injecting named connection
    @Inject('MODEL_ACTIONS') protected modelActions: ActionListDTO, // Assuming this is a dependency of your base class
  ) {
    super(qnatkService, hooksService, sequelize, modelActions);
  }

  // You can override base class methods here or add new methods specific to this subclass
}
