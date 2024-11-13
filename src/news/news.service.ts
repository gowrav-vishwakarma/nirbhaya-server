import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { News } from '../models/News'; // Import the model
import { FileService } from '../files/file.service';
import { NewsTranslation } from '../models/NewsTranslation';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News)
    private readonly newsModel: typeof News,
    private readonly fileService: FileService,
    @InjectModel(NewsTranslation)
    private readonly newsTranslationModel: typeof NewsTranslation,
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

  async updateNews(id: number, updateCommunityFeedDto) {
    return this.newsModel.update(updateCommunityFeedDto, {
      where: { id },
      returning: true,
    });
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

  async imageUpload(imageData: any): Promise<string[]> {
    const images = Array.isArray(imageData) ? imageData : [imageData];
    const uploadPromises = images.map(async (image) => {
      const imageName = image?.originalname;
      const uniqueValue = new Date().toISOString().replace(/[:.-]/g, '');
      const filePath = await this.fileService.uploadFile(
        `uploads/news/`,
        `${imageName}_${uniqueValue}`,
        image, // Assuming `image` has a `file` property for the file data
      );
      return filePath;
    });
    const uploadedFilePaths = await Promise.all(uploadPromises);
    return uploadedFilePaths;
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
