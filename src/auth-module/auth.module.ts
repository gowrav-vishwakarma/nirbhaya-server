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
// import { SequelizeModule } from '@nestjs/sequelize';
// import { User } from 'src/models/user.model';
import { SosService } from './sos/sos.service';
import { Notification } from 'src/models/Notification';
import { FirebaseService } from 'src/firebase/firebase.service';
import { StreamingGateway } from '../streaming/streaming.gateway';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'abc_secret',
        signOptions: {
          expiresIn: configService.get<string | number>('JWT_EXPIRE') || '24h',
        },
      }),
    } as JwtModuleAsyncOptions),
    SequelizeModule.forFeature([
      User,
      EmergencyContact,
      UserLocation,
      SosEvent,
      Notification,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    SosService,
    FirebaseService,
    StreamingGateway,
  ],
  exports: [AuthService, AuthGuard, JwtModule, SosService, StreamingGateway],
})
export class AuthModule {}
