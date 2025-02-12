import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
import { CommentLike } from './models/CommentLike';
import { CommentReply } from './models/CommentReply';
import { PostComment } from './models/PostComment';
import { PostLike } from './models/PostLike';
import { EventLog } from './models/EventLog';
import { EventCount } from './models/EventCount';
import { FileModule } from './files/file.module';
import { NewsModule } from './news/news.module';
import { Feedback } from './models/Feedback';
import { UserInteraction } from './models/UserInteractions';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { Admin } from './models/Admin';
import { GovPincodeData } from './models/GovPincodeData';
import { News } from './models/News';
import { SmsService } from './sms/sms.service';
import { HttpModule } from '@nestjs/axios';
import { SearchModule } from './search/search.module';
import { GlobalModule } from './global/global.module';
import { GlobalService } from './global/global.service';
import { FileService } from './files/file.service';
import { NewsTranslation } from './models/NewsTranslation';
import { EventSummery } from './models/EventSummery';
import { PointsRulesEntity } from './models/PointsRulesEntity';
import { CommunityPostModule } from './communityPost/community-post.module';
import { ReferralLog } from './models/ReferralLog';
import AclEntityActions from './models/AclEntityActions';
import AclRolePermissions from './models/AclRolePermissions';
import AclRoles from './models/AclRoles';
import AdminQnatkController from './admin-auth/admin-auth-qnatk.controller';
import { CommunityPost } from './models/CommunityPost';
import { TempOtps } from './models/TempOtps';
import { SystemConfig } from './models/SystemConfig';
import { CatalogItem } from './models/CatalogItem';
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
  EventLog,
  EventCount,
  NewsTranslation,
  EventSummery,
  PointsRulesEntity,
  CommentLike,
  CommentReply,
  PostComment,
  PostLike,
  UserInteraction,
  ReferralLog,
  AclEntityActions,
  AclRolePermissions,
  AclRoles,
  CommunityPost,
  TempOtps,
  SystemConfig,
  CatalogItem,
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
        synchronize: false,
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
        pool: {
          max: 20,
          min: 0,
          acquire: 60000,
          idle: 10000,
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
    GlobalModule,
    CommunityPostModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, NirbhayaQnatkController, AdminQnatkController],
  providers: [
    AppService,
    SmsService,
    ConfigService,
    GlobalService,
    FileService,
  ],
  exports: [SmsService, GlobalService, FileService],
})
export class AppModule {}
