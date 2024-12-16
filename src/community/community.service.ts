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
}
