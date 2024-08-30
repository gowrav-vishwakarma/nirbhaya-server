import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ActionListDTO, QnatkService } from './qnatk/src';

@Injectable()
export class NirbhayaQnatkService extends QnatkService {
  constructor(
    @InjectConnection('default') protected sequelize: Sequelize,
    @Inject('MODEL_ACTIONS')
    protected modelActions: Record<string, ActionListDTO>[],
  ) {
    super(sequelize, modelActions);
  }
  // You can override methods or add new methods here if needed
}
