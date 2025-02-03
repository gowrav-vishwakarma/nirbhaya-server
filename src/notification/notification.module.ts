import { Module, forwardRef } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notification } from '../models/Notification';
import { AuthModule } from '../auth-module/auth.module';
import { User } from 'src/models/User';
import { SosModule } from 'src/sos/sos.module';
import { SosEvent } from 'src/models/SosEvent';
@Module({
  imports: [
    SequelizeModule.forFeature([Notification, User, SosEvent]),
    forwardRef(() => AuthModule),
    SosModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
