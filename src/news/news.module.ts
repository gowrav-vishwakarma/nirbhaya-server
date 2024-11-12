import { forwardRef, Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { FileService } from '../files/file.service';
import { NewsController } from './news.controller';
import { News } from '../models/News';
import { AuthModule } from 'src/auth-module/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
// import { FileModule } from '../files/file.module';

@Module({
  imports: [SequelizeModule.forFeature([News]), forwardRef(() => AuthModule)],
  controllers: [NewsController],
  providers: [NewsService, FileService],
})
export class NewsModule {}
