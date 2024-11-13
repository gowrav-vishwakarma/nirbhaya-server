import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { News } from '../models/News';
import { FileService } from '../files/file.service';
import { NewsTranslation } from '../models/NewsTranslation';
import { ConfigService } from '@nestjs/config';
import { Op, Sequelize } from 'sequelize';

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

      // Use transaction to ensure data consistency
      const result = await this.newsModel.sequelize?.transaction(async (t) => {
        // Create the news entry
        const news = await this.newsModel.create(createCommunityFeedDto, {
          transaction: t,
        });

        // Create default translation in the same language
        await this.newsTranslationModel.create(
          {
            newsId: news.id,
            languageCode: createCommunityFeedDto.defaultLanguage,
            title: createCommunityFeedDto.title,
            content: createCommunityFeedDto.content,
          },
          {
            transaction: t,
          },
        );

        // Return news with the created translation
        return this.newsModel.findByPk(news.id, {
          include: [{ model: NewsTranslation }],
          transaction: t,
        });
      });

      return result;
    } catch (error) {
      console.error('Create news error:', error);
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
      const oldMediaUrls = news.mediaUrls || [];
      for (const url of oldMediaUrls) {
        try {
          await this.fileService.deleteFile(url);
        } catch (error) {
          console.error('Error deleting old file:', error);
        }
      }

      const uploadedUrls = await this.imageUpload(files);
      updateNewsDto.mediaUrls = uploadedUrls;
    }

    // Update the news
    await news.update(updateNewsDto);

    // Update the default language translation if it exists
    const defaultTranslation = await this.newsTranslationModel.findOne({
      where: {
        newsId: id,
        languageCode: updateNewsDto.defaultLanguage,
      },
    });

    if (defaultTranslation) {
      await defaultTranslation.update({
        title: updateNewsDto.title,
        content: updateNewsDto.content,
      });
    } else {
      // Create default translation if it doesn't exist
      await this.newsTranslationModel.create({
        newsId: id,
        languageCode: updateNewsDto.defaultLanguage,
        title: updateNewsDto.title,
        content: updateNewsDto.content,
      });
    }

    // Return updated news with translations
    return this.newsModel.findByPk(id, {
      include: [{ model: NewsTranslation }],
    });
  }

  async findAllNews({
    limit,
    offset,
    language,
    categories,
  }: {
    limit: number;
    offset: number;
    language?: string;
    categories?: string[];
  }) {
    const whereClause: any = {};

    if (categories && categories.length > 0) {
      whereClause.categories = {
        [Op.overlap]: categories,
      };
    }

    const { count, rows } = await this.newsModel.findAndCountAll({
      limit,
      offset,
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: NewsTranslation,
          where: language ? { languageCode: language } : undefined,
          required: false,
        },
      ],
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

  async findUserNews({
    limit,
    offset,
    language,
    categories,
  }: {
    limit: number;
    offset: number;
    language?: string;
    categories?: string[];
  }) {
    const whereClause: any = {
      status: 'active',
    };

    if (categories && Array.isArray(categories) && categories.length > 0) {
      whereClause[Op.or] = categories.map((category) => ({
        categories: {
          [Op.like]: `%${category}%`,
        },
      }));
    }

    const { count, rows } = await this.newsModel.findAndCountAll({
      limit,
      offset,
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: NewsTranslation,
          where: language ? { languageCode: language } : undefined,
          required: false,
        },
      ],
    });

    return {
      items: rows,
      total: count,
    };
  }

  // Add your business logic here
}
