import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { AuthGuard } from '../auth-module/auth.guard';
import { GetUser } from 'src/auth-module/getuser.decorator';
import { UserJWT } from 'src/dto/user-jwt.dto';

@Controller('leaderboard')
@UseGuards(AuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('referral-info')
  async getUserReferralInfo(@GetUser() user: UserJWT) {
    return this.leaderboardService.getUserReferralInfo(user.id);
  }

  @Get()
  async getLeaderboard(@Query('limit') limit: string = '10') {
    return this.leaderboardService.getLeaderboard(parseInt(limit, 10));
  }
}
