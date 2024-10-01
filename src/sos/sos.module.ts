import { Module, forwardRef } from '@nestjs/common';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { SosEvent } from '../models/SosEvent';
import { AuthModule } from '../auth-module/auth.module';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { Notification } from 'src/models/Notification';
import { FirebaseService } from './firebase.service';
import { StreamingModule } from 'src/streaming/streaming.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      SosEvent,
      User,
      EmergencyContact,
      Notification,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => StreamingModule),
  ],
  controllers: [SosController],
  providers: [SosService, FirebaseService],
  exports: [SosService, FirebaseService],
})
export class SosModule {}
