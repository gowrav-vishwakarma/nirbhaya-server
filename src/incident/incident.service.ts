import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Incident } from '../models/Incident';
import { User } from '../models/User';
import { Like } from '../models/Likes';
import { Comment } from '../models/Comments';
import { Share } from '../models/Shares';
import { FindOptions } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { FileService } from '../files/file.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class IncidentService {
  private s3: S3Client;

  constructor(
    @InjectModel(Incident)
    private incidentModel: typeof Incident,
    @InjectModel(Like)
    private likeModel: typeof Like,
    @InjectModel(Comment)
    private commentsModel: typeof Comment,
    @InjectModel(Share)
    private sharesModel: typeof Share,
    private configService: ConfigService,
    private fileService: FileService,
  ) {
    this.s3 = new S3Client({
      endpoint: this.configService.get('S3_ENDPOINT'),
      region: this.configService.get('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      },
    });
  }

  async create(createIncidentDto: any): Promise<Incident> {
    if (!createIncidentDto.latitude || !createIncidentDto.longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const incidentData = {
      ...createIncidentDto,
      location: {
        type: 'Point',
        coordinates: [createIncidentDto.longitude, createIncidentDto.latitude],
      },
    };

    // Remove latitude and longitude from the DTO as they're not direct fields in the Incident model
    delete incidentData.latitude;
    delete incidentData.longitude;

    const incident = new Incident(incidentData);
    return incident.save();
  }

  async likeIncident(likeIncidentDto: any) {
    const { userId, incidentId, isLiked } = likeIncidentDto; // Destructure the input DTO
    try {
      // Using findOrCreate to ensure a user can only like an incident once
      const [like, created] = await this.likeModel.findOrCreate({
        where: {
          userId,
          incidentId,
        },
        defaults: {
          userId,
          incidentId,
        },
      });

      if (created) {
        console.log('New like created:', like);
        await this.incidentModel.increment('likes', {
          where: { id: incidentId },
        });
      } else {
        console.log('Like already exists. Removing the like:', like);
        if (!isLiked) {
          await this.likeModel.destroy({
            where: {
              userId,
              incidentId,
            },
          });
          await this.incidentModel.decrement('likes', {
            where: { id: incidentId },
          });
        }
      }

      return like;
    } catch (error) {
      console.error('Error in likeIncident:', error); // Log the entire error
      throw new Error('Could not process like incident.');
    }
  }

  async checkLike(userId: any, incidentId: any): Promise<boolean> {
    try {
      console.log('Checking if liked:', userId, incidentId);

      const like = await this.likeModel.findOne({
        where: {
          userId: userId, // Use the passed userId
          incidentId: incidentId, // Use the passed incidentId
        },
      });

      return !!like; // Return true if a like exists, otherwise false
    } catch (error) {
      console.error('Error in checkLike,:', error);
      throw new Error('Could not check like status.');
    }
  }

  async createIncidentComments(comment: any) {
    const createdComment = await this.commentsModel.create(comment);
    if (createdComment) {
      await this.incidentModel.increment('comments', {
        where: { id: comment.incidentId },
      });
    }
    return createdComment;
  }
  async createlogshare(share: any) {
    const createdComment = await this.sharesModel.create(share);
    if (createdComment) {
      await this.incidentModel.increment('shares', {
        where: { id: share.incidentId },
      });
    }
    return createdComment;
  }

  async getIncidentComments(id: number, limit: number) {
    console.log('Incident ID:', id, limit);
    const comments = await this.commentsModel.findAll({
      where: {
        incidentId: Number(id),
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'ASC']],
      limit: limit,
      raw: true,
      nest: true,
    });
    console.log('Latest comments.......', comments);
    return comments; // Return the fetched comments
  }

  async getPresignedUrlForUpload(
    fileName: string,
    contentType: string,
  ): Promise<string> {
    const key = `incidents/${new Date().toISOString().split('T')[0]}/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.configService.get('S3_BUCKET'),
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  async findAll(options: FindOptions<Incident>): Promise<Incident[]> {
    console.log(options);
    return this.incidentModel.findAll({
      ...options,
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: number): Promise<Incident> {
    return this.incidentModel.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name'] }],
    });
  }

  async update(
    id: number,
    updateIncidentDto: Partial<Incident>,
  ): Promise<[number, Incident[]]> {
    return this.incidentModel.update(updateIncidentDto, {
      where: { id },
      returning: true,
    });
  }

  async remove(id: number): Promise<number> {
    return this.incidentModel.destroy({ where: { id } });
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

  async createShort(createShortDto: any): Promise<Incident> {
    const shortData = { ...createShortDto };

    // Check if location data exists in the DTO
    if (shortData.location && shortData.location.coordinates) {
      // Keep the location data as is
      shortData.location = {
        type: 'Point',
        coordinates: shortData.location.coordinates,
      };
    } else if (shortData.latitude && shortData.longitude) {
      // If separate latitude and longitude are provided, format them
      shortData.location = {
        type: 'Point',
        coordinates: [shortData.longitude, shortData.latitude],
      };
    }

    // Remove latitude and longitude if they exist as separate fields
    delete shortData.latitude;
    delete shortData.longitude;

    const short = await this.incidentModel.create(shortData);
    return short;
  }

  async findAllShorts(options: FindOptions<Incident>): Promise<Incident[]> {
    return this.incidentModel.findAll({
      ...options,
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOneShort(id: number): Promise<Incident> {
    return this.incidentModel.findOne({
      where: {
        id,
      },
      include: [{ model: User, attributes: ['id', 'name'] }],
    });
  }

  async updateShort(
    id: number,
    updateShortDto: any,
  ): Promise<[number, Incident[]]> {
    const updateData = { ...updateShortDto };

    // Check if location data exists in the DTO
    if (updateData.location && updateData.location.coordinates) {
      // Keep the location data as is
      updateData.location = {
        type: 'Point',
        coordinates: updateData.location.coordinates,
      };
    } else if (updateData.latitude && updateData.longitude) {
      // If separate latitude and longitude are provided, format them
      updateData.location = {
        type: 'Point',
        coordinates: [updateData.longitude, updateData.latitude],
      };
    }

    // Remove latitude and longitude from the update data if they exist
    delete updateData.latitude;
    delete updateData.longitude;

    return this.incidentModel.update(updateData, {
      where: { id },
      returning: true,
    });
  }

  async deleteShort(id: number): Promise<number> {
    return this.incidentModel.destroy({
      where: {
        id,
      },
    });
  }
}
