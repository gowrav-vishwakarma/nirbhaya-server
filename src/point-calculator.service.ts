import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventSummery } from 'src/models/EventSummery';
import { EventCount } from 'src/models/EventCount';
import { Sequelize } from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
// import { Op } from 'sequelize';
// import * as moment from 'moment';

@Injectable()
export class SosService {
  private s3: S3Client | null = null;

  constructor(
    @InjectModel(EventSummery) private readonly eventSummeryModel: typeof EventSummery,
    @InjectModel(EventCount) private readonly eventCountModel: typeof EventCount,
    private sequelize: Sequelize,
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

  // async createEventSummery(EventData: any) {
  //   try {
  //     //const { feedbackGiverId, feedbackReceiverId, eventId } = feedbackData;
  //     // const existingFeedback = await this.eventCountModel.findAll({
  //       // where: {
  //       //   feedbackGiverId: feedbackGiverId, // This is undefined
  //       //   feedbackReceiverId: feedbackReceiverId,
  //       //   eventId: eventId,
  //       // },
  //     // });

  //     //if (existingFeedback) {
  //     //   const feedback = await this.eventSummeryModel.create({
  //     //     ,
  //     //   });

  //     //   await this.eventCountModel.update(
  //     //     {
  //     //       isSync: true,
  //     //     },
  //     //     {
  //     //       where: {
  //     //       },
  //     //     },
  //     //   );
  //     //   return feedback;
  //     // }
  //   } catch (error) {
  //     console.error('Error creating or updating feedback:', error);
  //     // throw new HttpException('Failed to create or update feedback');
  //   }
  // }
}
