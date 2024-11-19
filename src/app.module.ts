import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { QnatkModule } from './qnatk/src';
import { NirbhayaQnatkService } from './nirbhaya-qnatk.service';
import { NirbhayaQnatkControllerService } from './nirbhaya-qnatk-controller.service';
import { ModelActions } from './modal-actions';
import { User } from './models/User';
import { EmergencyContact } from './models/EmergencyContact';
import { SosEvent } from './models/SosEvent';
import { UserLocation } from './models/UserLocation';
import { Notification } from './models/Notification';
import { Responder } from './models/Responder';
import { AuthModule } from './auth-module/auth.module';
import { NirbhayaQnatkController } from './nirbhaya.controller';
import { StreamingModule } from './streaming/streaming.module';
import { CommunityApplications } from './models/CommunityApplications';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { UserModule } from './user/user.module';
import { SosModule } from './sos/sos.module';
import { NotificationModule } from './notification/notification.module';
import { CommunityModule } from './community/community.module';
import { SuggestionModule } from './suggestion/suggestion.module';
import { IncidentModule } from './incident/incident.module';
import { Incident } from './models/Incident';
import { Like } from './models/Likes';
import { Comment } from './models/Comments';
import { Share } from './models/Shares';
import { FileModule } from './files/file.module';
import { NewsModule } from './news/news.module';
import { Feedback } from './models/Feedback';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { News } from './models/News';
import { SmsService } from './sms/sms.service';
import { HttpModule } from '@nestjs/axios';
import { Admin } from './models/Admin';
import { GovPincodeData } from './models/GovPincodeData';
import { News } from './models/News';
import { SmsService } from './sms/sms.service';
import { HttpModule } from '@nestjs/axios';
import { SearchModule } from './search/search.module';

export const sequelizeModelArray = [
  User,
  EmergencyContact,
  SosEvent,
  UserLocation,
  Notification,
  Responder,
  CommunityApplications,
  Incident,
  Like,
  Comment,
  Share,
  Feedback,
  News,
  Admin,
  GovPincodeData,
];
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigService available throughout the application
    }),
    HttpModule,
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: +configService.get<string>('DB_PORT'), // plus sign for converting string to number
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadModels: true,
        logQueryParameters: true,
        // synchronize: true,
        // sync: {
        //   alter: true,
        // },
        logging: console.log,
        timezone: '+05:30',
        dialectOptions: {
          dateStrings: true,
          typeCast: true,
          multipleStatements: true,
        },
      }),
      inject: [ConfigService],
    }),
    QnatkModule.forRoot(
      {
        hooksDirectory: __dirname + '/hooks',
      },
      [AppModule, SequelizeModule.forFeature(sequelizeModelArray)],
      [
        NirbhayaQnatkService,
        NirbhayaQnatkControllerService,
        {
          provide: 'MODEL_ACTIONS',
          useValue: ModelActions,
        },
      ],
      [NirbhayaQnatkControllerService],
    ),
    SequelizeModule.forFeature(sequelizeModelArray),
    AuthModule,
    UserModule,
    SosModule,
    NotificationModule,
    CommunityModule,
    SuggestionModule,
    StreamingModule,
    LeaderboardModule,
    IncidentModule,
    AdminAuthModule,
    FileModule,
    NewsModule,
    SearchModule,
  ],
  controllers: [AppController, NirbhayaQnatkController],
  providers: [AppService, SmsService, ConfigService],
  exports: [SmsService],
})
export class AppModule {}
