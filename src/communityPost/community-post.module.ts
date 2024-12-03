import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommunityPostController } from './community-post.controller';
import { CommunityPostService } from './community-post.service';
import { CommunityPost } from '../models/CommunityPost';
import { User } from '../models/User';
import { Like } from '../models/Likes';
import { Comment } from '../models/Comments';
import { Share } from '../models/Shares';
import { FileModule } from '../files/file.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CommunityPost, User, Like, Comment, Share]),
    FileModule,
  ],
  controllers: [CommunityPostController],
  providers: [CommunityPostService],
  exports: [CommunityPostService],
})
export class CommunityPostModule {}