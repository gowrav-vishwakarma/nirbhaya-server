import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { GovPincodeData } from '../models/GovPincodeData';

@Module({
  imports: [SequelizeModule.forFeature([GovPincodeData])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
