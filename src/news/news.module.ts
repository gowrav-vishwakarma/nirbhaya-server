import { forwardRef, Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { FileService } from '../files/file.service';
import { NewsController } from './news.controller';
import { News } from '../models/News';
import { AuthModule } from 'src/auth-module/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { NewsTranslation } from '../models/NewsTranslation';
import { User } from '../models/User';

@Module({
  imports: [
    SequelizeModule.forFeature([News, NewsTranslation, User]),
    forwardRef(() => AuthModule),
  ],
  controllers: [NewsController],
  providers: [NewsService, FileService],
})
export class NewsModule {}
