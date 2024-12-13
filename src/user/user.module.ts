import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../models/User';
import { EmergencyContact } from '../models/EmergencyContact';
import { UserLocation } from '../models/UserLocation';
import { AuthModule } from '../auth-module/auth.module';
import { EventLog } from 'src/models/EventLog';
@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      EmergencyContact,
      UserLocation,
      EventLog,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
