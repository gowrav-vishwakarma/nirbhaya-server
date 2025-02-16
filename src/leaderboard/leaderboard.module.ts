import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { User } from '../models/User';
import { UserLocation } from '../models/UserLocation';
import { AuthModule } from 'src/auth-module/auth.module';
import { EventLog } from '../models/EventLog';

@Module({
  imports: [
    SequelizeModule.forFeature([User, UserLocation, EventLog]),
    AuthModule,
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
