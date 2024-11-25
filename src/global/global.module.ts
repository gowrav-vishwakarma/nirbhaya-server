import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GlobalService } from './global.service';
import { EventCount } from '../models/EventCount';

@Module({
  imports: [SequelizeModule.forFeature([EventCount])],
  providers: [GlobalService],
  exports: [GlobalService, SequelizeModule],
})
export class GlobalModule {}
