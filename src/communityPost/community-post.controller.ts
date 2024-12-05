import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CommunityPostService } from './community-post.service';
import { GetUser } from '../auth-module/getuser.decorator';
import { UserJWT } from '../dto/user-jwt.dto';
import { AuthGuard } from '../auth-module/auth.guard';

@Controller('posts')
export class CommunityPostController {
  constructor(private readonly communityPostService: CommunityPostService) {}

  @Post('/post-create')
  @UseInterceptors(AnyFilesInterceptor())
  async createPost(
    @Body() createPostDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      return await this.communityPostService.create(createPostDto, files);
    } catch (error) {
      console.error('Create post error:', error);
      throw new BadRequestException('Invalid data format');
    }
  }

  @UseGuards(AuthGuard)
  @Get('community-posts')
  async getCommunityPosts(
    @Query('status') status: string,
    @Query('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
    @GetUser() user: UserJWT,
  ) {
    console.log('user..........', user.id);

    const offset = (page - 1) * limit;
    return this.communityPostService.findAll({
      status,
      userId: user.id,
      offset,
      limit: Number(limit),
    });
  }

  @Get('my-posts')
  async getMyPosts(
    @Query('userId') userId: number,
    @Query('status') status: string,
  ) {
    return this.communityPostService.findAllmyPost({ userId, status });
  }

  @Get('delete-post')
  async deletePost(
    @Param('id') postId: number,
    @Param('userId') userId: number,
  ) {
    return this.communityPostService.deletePost(postId, userId);
  }

  @Post(':id/like')
  async likePost(
    @Param('id') postId: number,
    @Body() data: { userId: number; postId: number },
    @GetUser() user: UserJWT,
  ) {
    if (!data.userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.communityPostService.likePost(postId, user.id);
  }
  @UseGuards(AuthGuard)
  @Post(':id/unlike')
  async unlikePost(
    @Param('id') postId: number,
    @Body() data: { userId: number; postId: number },
    @GetUser() user: UserJWT,
  ) {
    if (!data.userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.communityPostService.unlikePost(postId, user.id);
  }

  @UseGuards(AuthGuard)
  @Post(':postId/comments')
  async addComment(
    @Param('postId') postId: string,
    @Body('content') content: string,
    @GetUser() user: UserJWT,
  ) {
    if (!user.id) {
      throw new Error('User not authenticated');
    }

    return await this.communityPostService.addComment(
      +postId,
      content,
      user.id,
    );
  }

  @Get(':postId/comments')
  async getComments(@Param('postId') postId: string) {
    return await this.communityPostService.getComments(+postId);
  }

  @UseGuards(AuthGuard)
  @Post('comments/:commentId/like')
  async likeComment(
    @Param('commentId') commentId: string,
    @GetUser() user: UserJWT,
  ) {
    return await this.communityPostService.likeComment(+commentId, user.id);
  }

  @UseGuards(AuthGuard)
  @Delete('comments/:commentId/like')
  async unlikeComment(
    @Param('commentId') commentId: string,
    @Body('userId') userId: number,
    @GetUser() user: UserJWT,
  ) {
    return await this.communityPostService.unlikeComment(+commentId, user.id);
  }

  @UseGuards(AuthGuard)
  @Post('comments/:commentId/replies')
  async addReply(
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @Body('userId') userId: number,
    @GetUser() user: UserJWT,
  ) {
    return await this.communityPostService.addReply(
      +commentId,
      content,
      user.id,
    );
  }

  @Get('comments/:commentId/replies')
  async getReplies(@Param('commentId') commentId: string) {
    return await this.communityPostService.getReplies(+commentId);
  }
  @Get('user-interaction/:userId')
  async getUserInteraction(@Param('userId') userId: number) {
    return await this.communityPostService.getUserInteraction(userId);
  }
}
