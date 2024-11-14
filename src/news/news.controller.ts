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
  Delete,
  UseGuards,
} from '@nestjs/common';
import { News } from '../models/News'; // Import the model
import { NewsService } from './news.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth-module/getuser.decorator';
import { AuthGuard } from 'src/auth-module/auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('news')
  async getAllNews(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('language') language?: string,
    @Query('categories') categories?: string,
  ) {
    const offset = (Number(page) - 1) * Number(pageSize);
    let categoryArray: string[] | undefined;

    if (categories) {
      try {
        categoryArray = Array.isArray(categories) ? categories : [categories];
      } catch (error) {
        console.error('Error parsing categories:', error);
      }
    }

    return this.newsService.findAllNews({
      limit: Number(pageSize),
      offset,
      language,
      categories: categoryArray,
    });
  }

  @Post('create-news')
  @UseInterceptors(AnyFilesInterceptor())
  @UseGuards(AuthGuard)
  async createNews(
    @Body() createNewsDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @GetUser() user: any,
  ) {
    try {
      // Parse categories if it exists and is a string
      if (createNewsDto.categories) {
        createNewsDto.categories = JSON.parse(createNewsDto.categories);
      }
      return this.newsService.createNews(createNewsDto, files, user);
    } catch (error) {
      console.error('Create news error:', error);
      throw new BadRequestException('Invalid data format');
    }
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
  @UseInterceptors(AnyFilesInterceptor())
  async updateNews(
    @Param('id') id: string,
    @Body() updateNewsDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      // Parse categories if it exists and is a string
      if (updateNewsDto.categories) {
        updateNewsDto.categories = JSON.parse(updateNewsDto.categories);
      }
      return this.newsService.updateNews(+id, updateNewsDto, files);
    } catch (error) {
      console.error('Update news error:', error);
      throw new BadRequestException('Invalid data format');
    }
  }

  @Post('translations')
  async createTranslation(@Body() translationDto: any) {
    return this.newsService.createTranslation(translationDto);
  }

  @Get('translations/:newsId')
  async getTranslations(@Param('newsId') newsId: string) {
    return this.newsService.getTranslations(+newsId);
  }

  @Delete(':id')
  async deleteNews(@Param('id') id: string) {
    return this.newsService.deleteNews(+id);
  }

  @Delete('translations/:id')
  async deleteTranslation(@Param('id') id: string) {
    return this.newsService.deleteTranslation(+id);
  }

  @Put('translations/:id')
  async updateTranslation(
    @Param('id') id: string,
    @Body() translationDto: any,
  ) {
    return this.newsService.updateTranslation(+id, translationDto);
  }

  @Get('user-news')
  async getUserNews(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('language') language?: string,
    @Query('categories') categories?: string | string[],
    @Query('newsType') newsType?: 'indian' | 'international' | 'all',
  ) {
    const offset = (Number(page) - 1) * Number(pageSize);
    let categoryArray: string[] | undefined;

    if (categories) {
      try {
        categoryArray = Array.isArray(categories)
          ? categories
          : typeof categories === 'string'
            ? [categories]
            : undefined;
      } catch (error) {
        console.error('Error parsing categories:', error);
      }
    }

    return this.newsService.findUserNews({
      limit: Number(pageSize),
      offset,
      language,
      categories: categoryArray,
      newsType,
    });
  }

  @Post('fetch-external')
  @UseGuards(AuthGuard)
  async fetchExternalNews(
    @Body() params: { categories?: string[]; languages?: string[] },
    @GetUser() user: any,
  ) {
    return this.newsService.fetchAndSaveExternalNews(params, user);
  }

  // Define your endpoints here
}
