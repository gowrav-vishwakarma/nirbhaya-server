import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService, LeaderboardEntry } from './leaderboard.service';
import { AuthGuard } from '../auth-module/auth.guard';
import { GetUser } from 'src/auth-module/getuser.decorator';
import { UserJWT } from 'src/dto/user-jwt.dto';

@Controller('leaderboard')
@UseGuards(AuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @GetUser() user: UserJWT,
    @Query('scope') scope: 'location' | 'administrative',
    @Query('coordinates') coordinates?: number[],
    @Query('radius') radius?: number,
    @Query('region') region?: 'city' | 'state' | 'country',
    @Query('city') city?: string,
    @Query('state') state?: string,
  ): Promise<LeaderboardEntry[]> {
    if (scope === 'location' && coordinates?.length === 2) {
      return this.leaderboardService.getLocationLeaderboard(
        user.id,
        [coordinates[0], coordinates[1]],
        radius || 5,
      );
    } else if (scope === 'administrative' && region) {
      return this.leaderboardService.getAdministrativeLeaderboard(
        user.id,
        region,
        city,
        state,
      );
    }
  }

  @Get('referral-info')
  async getUserReferralInfo(@GetUser() user: UserJWT) {
    return this.leaderboardService.getUserReferralInfo(user.id);
  }
}
