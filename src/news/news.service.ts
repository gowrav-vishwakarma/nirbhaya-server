import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { News } from '../models/News';
import { FileService } from '../files/file.service';
import { NewsTranslation } from '../models/NewsTranslation';
import { ConfigService } from '@nestjs/config';
import { Op, Sequelize } from 'sequelize';
import axios from 'axios';

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

  async fetchAndSaveExternalNews(
    params: {
      categories?: string[];
      languages?: string[];
      date?: string;
    },
    user: any,
  ) {
    const apiKey = this.configService.get('MEDIASTACK_API_KEY');
    const baseUrl = 'http://api.mediastack.com/v1/news';

    try {
      const mediastackCategories = new Set([
        'general',
        'business',
        'entertainment',
        'health',
        'science',
        'sports',
        'technology',
      ]);

      const supportedCategories = params.categories
        ?.filter((cat) => mediastackCategories.has(cat))
        .join(',');

      // Function to fetch news with specific parameters
      const fetchNews = async (country?: string, date?: string) => {
        const response = await axios.get(baseUrl, {
          params: {
            access_key: apiKey,
            categories: supportedCategories || 'general',
            languages: params.languages?.join(',') || 'en',
            limit: 100,
            sort: 'published_desc',
            countries: country,
            date: date,
          },
        });
        return response.data.data || [];
      };

      // Fetch Indian news first
      const indianNews = await fetchNews('in', params.date);

      // Fetch global news (explicitly excluding India) for the same date
      const globalNews = await fetchNews('-in', params.date);

      // Process Indian news
      const processedIndianNews = indianNews.map((item) => ({
        ...item,
        isIndianNews: true,
      }));

      // Process global news
      const processedGlobalNews = globalNews.map((item) => ({
        ...item,
        isIndianNews: false,
      }));

      // Combine and remove duplicates based on title and URL
      const allNews = [...processedIndianNews, ...processedGlobalNews];
      const uniqueNews = allNews.filter(
        (item, index, self) =>
          index ===
          self.findIndex((t) => t.title === item.title || t.url === item.url),
      );

      const savedNews = [];
      const errors = [];

      // Use transaction for bulk operations
      await this.newsModel.sequelize?.transaction(async (t) => {
        for (const item of uniqueNews) {
          try {
            // Check for duplicate news in database
            const existingNews = await this.newsModel.findOne({
              where: {
                [Op.or]: [{ title: item.title }, { source: item.url }],
              },
              transaction: t,
            });

            if (!existingNews) {
              // Determine category based on whether it's Indian news or global news
              let category = item.category;
              if (category === 'general') {
                category = item.isIndianNews ? 'general' : 'world_news';
              }

              // For non-Indian news, always set category to world_news
              if (!item.isIndianNews) {
                category = 'world_news';
              }

              const news = await this.newsModel.create(
                {
                  userId: user.id,
                  title: item.title,
                  content: item.description,
                  mediaUrls: item.image ? [item.image] : [],
                  categories: [category],
                  defaultLanguage: item.language,
                  source: item.url,
                  status: 'active',
                  createdAt: item.published_at || new Date(),
                },
                { transaction: t },
              );

              await this.newsTranslationModel.create(
                {
                  newsId: news.id,
                  languageCode: item.language,
                  title: item.title,
                  content: item.description,
                },
                { transaction: t },
              );

              savedNews.push(news);
            }
          } catch (error) {
            errors.push({
              title: item.title,
              error: error.message,
            });
          }
        }
      });

      return {
        success: true,
        saved: savedNews.length,
        total: uniqueNews.length,
        errors: errors.length > 0 ? errors : undefined,
        indianNews: savedNews.filter(
          (news) =>
            news.categories.includes('general') ||
            !news.categories.includes('world_news'),
        ).length,
        globalNews: savedNews.filter((news) =>
          news.categories.includes('world_news'),
        ).length,
      };
    } catch (error) {
      console.error('Error fetching external news:', error);
      throw new Error('Failed to fetch external news: ' + error.message);
    }
  }

  // Add your business logic here
}
