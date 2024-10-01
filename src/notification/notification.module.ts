import { Module, forwardRef } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notification } from '../models/Notification';
import { AuthModule } from '../auth-module/auth.module';
import { User } from 'src/models/User';

@Module({
  imports: [
    SequelizeModule.forFeature([Notification, User]),
    forwardRef(() => AuthModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
