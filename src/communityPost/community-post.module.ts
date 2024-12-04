import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommunityPostController } from './community-post.controller';
import { CommunityPostService } from './community-post.service';
import { CommunityPost } from '../models/CommunityPost';
import { PostComment } from '../models/PostComment';
import { PostLike } from '../models/PostLike';
import { User } from '../models/User';
import { CommentLike } from '../models/CommentLike';
import { CommentReply } from '../models/CommentReply';
import { UserInteraction } from '../models/UserInteractions';
import { FileModule } from '../files/file.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CommunityPost,
      PostComment,
      PostLike,
      CommentLike,
      CommentReply,
      UserInteraction,
      User,
    ]),
    FileModule,
  ],
  controllers: [CommunityPostController],
  providers: [CommunityPostService],
  exports: [CommunityPostService],
})
export class CommunityPostModule {}
