import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Incident } from '../models/Incident';
import { User } from '../models/User';
import { FindOptions } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class IncidentService {
  private s3: S3Client;

  constructor(
    @InjectModel(Incident)
    private incidentModel: typeof Incident,
    private configService: ConfigService,
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
}
