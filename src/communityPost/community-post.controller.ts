import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { CommunityPostService } from './community-post.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class CommunityPostController {
  constructor(private readonly communityPostService: CommunityPostService) {}

  @Post('/post-create')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
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

  @Get('/community-posts')
  findAll(@Param() query: any) {
    console.log('Param.........', query);
    return this.communityPostService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communityPostService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: any) {
    return this.communityPostService.update(+id, updatePostDto);
  }
}
