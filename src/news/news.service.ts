import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { News } from '../models/News';
import { FileService } from '../files/file.service';
import { NewsTranslation } from '../models/NewsTranslation';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News)
    private readonly newsModel: typeof News,
    private readonly fileService: FileService,
    @InjectModel(NewsTranslation)
    private readonly newsTranslationModel: typeof NewsTranslation,
    private readonly configService: ConfigService,
  ) {}

  async createNews(createCommunityFeedDto: any, files: any, user: any) {
    try {
      // if (typeof createCommunityFeedDto.location === 'string') {
      //   createCommunityFeedDto.location = JSON.parse(
      //     createCommunityFeedDto.location,
      //   );
      // }
      let imageUrl = [];
      if (files) {
        try {
          imageUrl = await this.imageUpload(files);
        } catch (error) {
          console.error('Image upload failed:', error);
        }
      }
      createCommunityFeedDto.mediaUrls = imageUrl;
      createCommunityFeedDto.userId = user.id;
      return await this.newsModel.create(createCommunityFeedDto);
    } catch (error) {
      throw error;
    }
  }

  async updateNews(
    id: number,
    updateNewsDto: any,
    files?: Array<Express.Multer.File>,
  ) {
    const news = await this.newsModel.findByPk(id);
    if (!news) {
      throw new NotFoundException('News not found');
    }

    // Handle file uploads if new files are provided
    if (files && files.length > 0) {
      // Delete old files from storage
      const oldMediaUrls = news.mediaUrls || [];
      for (const url of oldMediaUrls) {
        try {
          await this.fileService.deleteFile(url);
        } catch (error) {
          console.error('Error deleting old file:', error);
        }
      }

      // Upload new files
      const uploadedUrls = await this.imageUpload(files);

      // Update DTO with new media URLs
      updateNewsDto.mediaUrls = uploadedUrls;
    }

    // Update the news
    await news.update(updateNewsDto);
    return news;
  }

  async findAllNews({ limit, offset }: { limit: number; offset: number }) {
    const { count, rows } = await this.newsModel.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: NewsTranslation }],
    });

    return {
      items: rows,
      total: count,
    };
  }

  async imageUpload(files: Array<Express.Multer.File>): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      const filePath = await this.fileService.uploadFile(
        'uploads/news/',
        uniqueFileName,
        file,
      );
      return filePath;
    });

    return Promise.all(uploadPromises);
  }

  async createTranslation(translationDto: any) {
    return this.newsTranslationModel.create(translationDto);
  }

  async getTranslations(newsId: number) {
    return this.newsTranslationModel.findAll({
      where: { newsId },
    });
  }

  async deleteNews(id: number) {
    // First get the news item to access its mediaUrls
    const news = await this.newsModel.findByPk(id);
    if (!news) {
      throw new Error('News not found');
    }

    // Delete associated media files
    if (news.mediaUrls && news.mediaUrls.length > 0) {
      const deletePromises = news.mediaUrls.map((filePath) =>
        this.fileService.deleteFile(filePath),
      );
      await Promise.all(deletePromises);
    }

    // Delete translations and news
    await this.newsTranslationModel.destroy({
      where: { newsId: id },
    });

    return this.newsModel.destroy({
      where: { id },
    });
  }

  async updateTranslation(id: number, translationDto: any) {
    return this.newsTranslationModel.update(translationDto, {
      where: { id },
      returning: true,
    });
  }

  async deleteTranslation(id: number) {
    return this.newsTranslationModel.destroy({
      where: { id },
    });
  }
  // Add your business logic here
}
