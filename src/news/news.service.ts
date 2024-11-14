import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { News } from '../models/News';
import { FileService } from '../files/file.service';
import { NewsTranslation } from '../models/NewsTranslation';
import { ConfigService } from '@nestjs/config';
import { Op, Sequelize } from 'sequelize';
import axios from 'axios';
import { Cron } from '@nestjs/schedule';
import * as xml2js from 'xml2js';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News)
    private readonly newsModel: typeof News,
    private readonly fileService: FileService,
    @InjectModel(NewsTranslation)
    private readonly newsTranslationModel: typeof NewsTranslation,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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

    let mediaUrls = news.mediaUrls || [];

    // Handle file uploads if new files are provided
    if (files && files.length > 0) {
      // Delete old files only if new files are being uploaded
      for (const url of mediaUrls) {
        try {
          // Only delete if it's a local file (not an external URL)
          if (!url.startsWith('http')) {
            await this.fileService.deleteFile(url);
          }
        } catch (error) {
          console.error('Error deleting old file:', error);
        }
      }

      const uploadedUrls = await this.imageUpload(files);
      mediaUrls = uploadedUrls;
    }

    // If mediaUrls is provided in the DTO (from imageSource), use those
    if (updateNewsDto.mediaUrls) {
      mediaUrls = updateNewsDto.mediaUrls;
    }

    // Update the news with all fields including mediaUrls
    const updatedNews = await news.update({
      ...updateNewsDto,
      mediaUrls,
    });

    // Update the default language translation
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
    newsType,
  }: {
    limit: number;
    offset: number;
    language?: string;
    categories?: string[];
    newsType?: 'indian' | 'international' | 'all';
  }) {
    const whereClause: any = {
      status: 'active',
    };

    // Handle news type filter
    if (newsType === 'indian') {
      whereClause.isIndianNews = true;
    } else if (newsType === 'international') {
      whereClause.isIndianNews = false;
    }

    // Handle categories filter with OR condition for MySQL
    if (categories && Array.isArray(categories) && categories.length > 0) {
      whereClause[Op.and] = [
        {
          [Op.or]: categories.map((category) =>
            Sequelize.literal(`JSON_CONTAINS(categories, '"${category}"')`),
          ),
        },
      ];
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

      // Fetch global news (explicitly excluding India) for the same date
      const globalNews = await fetchNews('-in', params.date);

      // Process global news
      const processedGlobalNews = globalNews.map((item) => ({
        ...item,
        isIndianNews: false,
      }));

      // Combine and remove duplicates based on title and URL
      const allNews = [...processedGlobalNews];
      const uniqueNews = allNews.filter(
        (item, index, self) =>
          index ===
          self.findIndex((t) => t.title === item.title || t.url === item.url),
      );

      // Sort uniqueNews by published_at date in descending order
      const sortedNews = uniqueNews.sort((a, b) => {
        const dateA = new Date(a.published_at || 0).getTime();
        const dateB = new Date(b.published_at || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      const savedNews = [];
      const errors = [];

      // Use transaction for bulk operations
      await this.newsModel.sequelize?.transaction(async (t) => {
        for (const item of sortedNews) {
          try {
            // Check for duplicate news in database
            const existingNews = await this.newsModel.findOne({
              where: {
                [Op.or]: [{ title: item.title }, { source: item.url }],
              },
              transaction: t,
            });

            if (!existingNews) {
              // Always use the original category, or 'general' if not specified
              const category = mediastackCategories.has(item.category)
                ? item.category
                : 'general';

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
                  isIndianNews: item.isIndianNews,
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
        total: sortedNews.length,
        errors: errors.length > 0 ? errors : undefined,
        indianNews: savedNews.filter((news) => news.isIndianNews).length,
        globalNews: savedNews.filter((news) => !news.isIndianNews).length,
      };
    } catch (error) {
      console.error('Error fetching external news:', error);
      throw new Error('Failed to fetch external news: ' + error.message);
    }
  }

  @Cron('0 * * * *') // Runs every hour
  async fetchIndianNews() {
    try {
      const TOI_RSS_URL =
        'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms';
      const response = await firstValueFrom(
        this.httpService.get(TOI_RSS_URL, {
          responseType: 'text',
        }),
      );

      // Parse XML to JSON
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);
      const newsItems = result.rss.channel.item;

      // Use transaction for bulk operations
      await this.newsModel.sequelize?.transaction(async (t) => {
        for (const item of newsItems) {
          try {
            // Check for duplicate news
            const existingNews = await this.newsModel.findOne({
              where: {
                [Op.or]: [{ title: item.title }, { source: item.link }],
              },
              transaction: t,
            });

            if (!existingNews) {
              // Extract image URL from enclosure or description
              let imageUrl = item.enclosure?.url;
              if (!imageUrl && item.description) {
                const imgMatch = item.description.match(/src="([^"]+)"/);
                imageUrl = imgMatch ? imgMatch[1] : null;
              }

              // Clean description text (remove HTML tags and links)
              const cleanDescription = item.description
                .replace(/<[^>]+>/g, '')
                .replace(/https?:\/\/[^\s]+/g, '')
                .trim();

              const news = await this.newsModel.create(
                {
                  title: item.title,
                  content: cleanDescription,
                  mediaUrls: imageUrl ? [imageUrl] : [],
                  categories: ['general'], // You can add more specific categories if needed
                  defaultLanguage: 'en',
                  source: item.link,
                  status: 'active',
                  isIndianNews: true,
                  createdAt: new Date(item['pubDate']),
                  userId: 1, // Set appropriate default user ID for system-generated content
                },
                { transaction: t },
              );

              await this.newsTranslationModel.create(
                {
                  newsId: news.id,
                  languageCode: 'en',
                  title: item.title,
                  content: cleanDescription,
                },
                { transaction: t },
              );
            }
          } catch (error) {
            console.error('Error processing news item:', error);
          }
        }
      });

      console.log('Indian news fetch completed successfully');
    } catch (error) {
      console.error('Error fetching Indian news:', error);
    }
  }

  // Add your business logic here
}
