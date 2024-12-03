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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CommunityPostService } from './community-post.service';

@Controller('posts')
export class CommunityPostController {
  constructor(private readonly communityPostService: CommunityPostService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() createPostDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return await this.communityPostService.create(
      { ...createPostDto, userId: createPostDto.userId },
      files,
    );
  }

  @Get('/community-posts')
  async findAll(@Query() query: any) {
    const options = {
      where: { status: query.status || 'active' },
      include: ['user', 'likes', 'comments'],
      order: [['createdAt', 'DESC']],
    };
    return await this.communityPostService.findAll(options);
  }

  @Post(':id/like')
  async likePost(
    @Param('id') postId: number,
    @Body() data: { userId: number; postId: number },
  ) {
    if (!data.userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.communityPostService.likePost(postId, data.userId);
  }

  @Post(':id/unlike')
  async unlikePost(
    @Param('id') postId: number,
    @Body() data: { userId: number; postId: number },
  ) {
    if (!data.userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.communityPostService.unlikePost(postId, data.userId);
  }

  @Post(':postId/comments')
  async addComment(
    @Param('postId') postId: string,
    @Body('content') content: string,
    @Body('userId') userId: number,
  ) {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return await this.communityPostService.addComment(+postId, content, userId);
  }

  @Get(':postId/comments')
  async getComments(@Param('postId') postId: string) {
    return await this.communityPostService.getComments(+postId);
  }

  @Post('comments/:commentId/like')
  async likeComment(
    @Param('commentId') commentId: string,
    @Body('userId') userId: number,
  ) {
    return await this.communityPostService.likeComment(+commentId, userId);
  }

  @Delete('comments/:commentId/like')
  async unlikeComment(
    @Param('commentId') commentId: string,
    @Body('userId') userId: number,
  ) {
    return await this.communityPostService.unlikeComment(+commentId, userId);
  }

  @Post('comments/:commentId/replies')
  async addReply(
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @Body('userId') userId: number,
  ) {
    return await this.communityPostService.addReply(
      +commentId,
      content,
      userId,
    );
  }

  @Get('comments/:commentId/replies')
  async getReplies(@Param('commentId') commentId: string) {
    return await this.communityPostService.getReplies(+commentId);
  }
}
