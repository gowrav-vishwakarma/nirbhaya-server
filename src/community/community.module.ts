import { Module, forwardRef } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommunityApplications } from '../models/CommunityApplications';
import { User } from '../models/User';
import { AuthModule } from '../auth-module/auth.module';
import { UserLocation } from 'src/models/UserLocation';
import { CommunityPost } from 'src/models/CommunityPost';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CommunityApplications,
      User,
      UserLocation,
      CommunityPost,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
