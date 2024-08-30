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

export const sequelizeModelArray = [
  User,
  EmergencyContact,
  SosEvent,
  UserLocation,
  Notification,
  Responder,
];
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigService available throughout the application
    }),
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
        synchronize: true,
        sync: {
          force: true,
        },
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
