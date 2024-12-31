import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommunityApplications } from '../models/CommunityApplications';
import { User } from '../models/User';
import { Sequelize } from 'sequelize-typescript';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Op } from 'sequelize';
import { UserLocation } from 'src/models/UserLocation';
import { CommunityPost } from '../models/CommunityPost';
import { VolunteerNearbyResponseDto } from './dto/volunteer-nearby.dto';
import { CatalogResponse, UpdateCatalogDto } from './dto/catalog.dto';
import { CatalogItem } from '../models/CatalogItem';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
} from './dto/catalog-item.dto';
import { FileService } from 'src/files/file.service';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(CommunityApplications)
    private readonly communityApplicationsModel: typeof CommunityApplications,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,
    @InjectModel(CommunityPost)
    private readonly communityPostModel: typeof CommunityPost,
    @InjectModel(CatalogItem)
    private readonly catalogItemModel: typeof CatalogItem,
    private readonly fileService: FileService,
  ) {}

  async applyToCommunity(data: any, userId: number): Promise<any> {
    const application = await this.communityApplicationsModel.create({
      userId,
      inspiration: data.inspiration,
      contribution: data.contribution,
      skills: data.skills,
      time: data.time,
    });
    await this.userModel.update(
      { hasJoinedCommunity: true },
      { where: { id: userId } },
    );
    return application;
  }

  async getVolunteersNearby(
    latitude: number,
    longitude: number,
    range: number,
  ): Promise<VolunteerNearbyResponseDto[]> {
    try {
      const volunteers = await this.userLocationModel.findAll({
        attributes: ['id', 'location'],
        include: [
          {
            model: this.userModel,
            attributes: ['id', 'profession'],
            where: {
              availableForCommunity: true,
            },
          },
        ],
        where: Sequelize.where(
          Sequelize.fn(
            'ST_Distance_Sphere',
            Sequelize.col('location'),
            Sequelize.fn('ST_GeomFromText', `POINT(${longitude} ${latitude})`),
          ),
          {
            [Op.lte]: range,
          },
        ),
      });

      return volunteers.map((volunteer) => ({
        id: volunteer.user.id,
        profession: volunteer.user.profession,
        location: volunteer.location,
      }));
    } catch (error) {
      console.error('Error fetching nearby volunteers:', error);
      throw new HttpException(
        'Failed to fetch nearby volunteers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessWhatsApp(
    postId: string,
  ): Promise<{ whatsappNumber: string }> {
    const post = await this.communityPostModel.findOne({
      where: { id: postId },
      include: [
        {
          model: User,
          attributes: ['whatsappNumber'],
        },
      ],
    });

    if (!post || !post.user) {
      throw new HttpException(
        'Business post not found or user is not a business account',
        HttpStatus.NOT_FOUND,
      );
    }

    return { whatsappNumber: post.user.whatsappNumber };
  }

  async getBusinessCatalog(userId: number): Promise<CatalogResponse> {
    const user = await this.userModel.findOne({
      where: { id: userId },
      attributes: ['hasCatalog', 'doesDelivery', 'deliveryText'],
      include: [
        {
          model: this.catalogItemModel,
          attributes: ['id', 'title', 'imageUrl', 'sequence'],
          order: [['sequence', 'ASC']],
        },
      ],
    });

    if (!user) {
      throw new HttpException(
        'Business information not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      hasCatalog: user.hasCatalog,
      doesDelivery: user.doesDelivery,
      deliveryText: user.deliveryText,
      catalogItems: user.catalogItems || [],
    };
  }

  async updateBusinessCatalog(userId: number, catalogData: UpdateCatalogDto) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    await user.update({
      hasCatalog: catalogData.hasCatalog,
      doesDelivery: catalogData.doesDelivery,
      deliveryText: catalogData.deliveryText,
    });

    return {
      message: 'Catalog settings updated successfully',
      data: {
        hasCatalog: user.hasCatalog,
        doesDelivery: user.doesDelivery,
        deliveryText: user.deliveryText,
      },
    };
  }

  async createCatalogItem(
    userId: number,
    itemData: CreateCatalogItemDto,
    file: Express.Multer.File,
  ) {
    let imageUrl = '';

    if (file) {
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      imageUrl = await this.fileService.uploadFile(
        `catalog-items/${userId}`,
        uniqueFileName,
        file,
      );
    }

    const catalogItem = await this.catalogItemModel.create({
      ...itemData,
      imageUrl,
      userId,
    });

    return catalogItem;
  }

  async updateCatalogItem(
    id: number,
    userId: number,
    itemData: UpdateCatalogItemDto,
    file?: Express.Multer.File,
  ) {
    const catalogItem = await this.catalogItemModel.findOne({
      where: { id, userId },
    });

    if (!catalogItem) {
      throw new HttpException('Catalog item not found', HttpStatus.NOT_FOUND);
    }

    let imageUrl = catalogItem.imageUrl;

    if (file) {
      // Delete old image if it exists
      if (catalogItem.imageUrl) {
        try {
          await this.fileService.deleteFile(catalogItem.imageUrl);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      // Upload new image
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      imageUrl = await this.fileService.uploadFile(
        `catalog-items/${userId}`,
        uniqueFileName,
        file,
      );
    }

    await catalogItem.update({
      ...itemData,
      imageUrl,
    });

    return catalogItem;
  }

  async deleteCatalogItem(id: number, userId: number) {
    const catalogItem = await this.catalogItemModel.findOne({
      where: { id, userId },
    });

    if (!catalogItem) {
      throw new HttpException('Catalog item not found', HttpStatus.NOT_FOUND);
    }

    // Delete the image file if it exists
    if (catalogItem.imageUrl) {
      try {
        await this.fileService.deleteFile(catalogItem.imageUrl);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await catalogItem.destroy();
    return { message: 'Catalog item deleted successfully' };
  }
}
