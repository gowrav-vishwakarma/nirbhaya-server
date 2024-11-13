import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Incident } from '../models/Incident';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';
import { FileService } from '../files/file.service';
import { AuthModule } from 'src/auth-module/auth.module';
import { User } from 'src/models/User';
import { Like } from 'src/models/Likes';
import { Comment } from 'src/models/Comments';
import { Share } from 'src/models/Shares';

@Module({
  imports: [
    SequelizeModule.forFeature([Incident, User, Like, Comment, Share]),
    forwardRef(() => AuthModule),
  ],
  controllers: [IncidentController],
  providers: [IncidentService, FileService],
})
export class IncidentModule {}
