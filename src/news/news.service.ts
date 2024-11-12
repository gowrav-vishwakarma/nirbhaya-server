import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { News } from '../models/News'; // Import the model
import { FileService } from '../files/file.service';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News)
    private newsModel: typeof News,
    private fileService: FileService,
  ) {}
  async createNews(createCommunityFeedDto: any, files: any) {
    try {
      if (typeof createCommunityFeedDto.location === 'string') {
        createCommunityFeedDto.location = JSON.parse(
          createCommunityFeedDto.location,
        );
      }
      let imageUrl = [];
      if (files) {
        try {
          imageUrl = await this.imageUpload(files);
        } catch (error) {
          console.error('Image upload failed:', error);
        }
      }
      createCommunityFeedDto.mediaUrls = imageUrl;
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
    console.log('limit..........', limit, offset);

    return this.newsModel.findAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']], // Order by creation date, descending
    });
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
  // Add your business logic here
}
