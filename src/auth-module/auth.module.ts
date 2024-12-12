import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtModuleAsyncOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { UserLocation } from 'src/models/UserLocation';
import { SosEvent } from 'src/models/SosEvent';
import { Notification } from 'src/models/Notification';
import { CommunityApplications } from 'src/models/CommunityApplications';
import { StreamingModule } from 'src/streaming/streaming.module';
import { Suggestion } from 'src/models/Suggestion';
import { AppModule } from 'src/app.module';
import { GlobalService } from 'src/global/global.service';
import { CommunityPost } from '../models/CommunityPost';
import { TempOtps } from 'src/models/TempOtps';
import { FirebaseService } from 'src/sos/firebase.service';
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'abc_secret',
        signOptions: {
          expiresIn: configService.get<string | number>('JWT_EXPIRE') || '360d',
        },
      }),
    } as JwtModuleAsyncOptions),
    SequelizeModule.forFeature([
      User,
      EmergencyContact,
      UserLocation,
      SosEvent,
      Notification,
      CommunityApplications,
      Suggestion,
      CommunityPost,
      TempOtps,
    ]),
    forwardRef(() => StreamingModule),
    forwardRef(() => AppModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, GlobalService, FirebaseService],
  exports: [AuthService, AuthGuard, JwtModule, GlobalService],
})
export class AuthModule {}
