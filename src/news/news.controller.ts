import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { News } from '../models/News'; // Import the model
import { NewsService } from './news.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('news')
  async getAllNews(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    console.log('limit..........', page, pageSize);

    const offset = (Number(page) - 1) * Number(pageSize);
    return this.newsService.findAllNews({
      limit: Number(pageSize),
      offset,
    });
  }

  @Post('create-news')
  @UseInterceptors(AnyFilesInterceptor())
  async createNews(
    @Body() createCommunityFeedDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    console.log('files.........', files);

    return this.newsService.createNews(createCommunityFeedDto, files);
  }

  @Post('upload-media')
  @UseInterceptors(AnyFilesInterceptor())
  async imageUpload(@UploadedFiles() files: Array<Express.Multer.File>) {
    console.log('Received files:', files);
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.newsService.imageUpload(files);
  }

  @Put('update-news/:id')
  async updateNews(
    @Param('id') id: string,
    @Body() updateCommunityFeedDto: any,
  ) {
    return this.newsService.updateNews(+id, updateCommunityFeedDto);
  }
  // Define your endpoints here
}
