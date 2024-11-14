import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { News } from '../models/News';
import { NewsTranslation } from '../models/NewsTranslation';
import { FileModule } from '../files/file.module';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from 'src/models/User';
import { AuthModule } from 'src/auth-module/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([News, NewsTranslation, User]),
    FileModule,
    HttpModule,
    ScheduleModule.forRoot(),
    forwardRef(() => AuthModule),
  ],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
