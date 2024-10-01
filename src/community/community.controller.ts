import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { CommunityService } from './community.service';
import { AuthGuard } from '../auth-module/auth.guard';
import { GetUser } from '../auth-module/getuser.decorator';
import { UserJWT } from '../dto/user-jwt.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(AuthGuard)
  @Post('apply')
  async applyToCommunity(@Body() data: any, @GetUser() user: UserJWT) {
    return this.communityService.applyToCommunity(data, user.id);
  }

  @UseGuards(AuthGuard)
  @Get('volunteers-nearby')
  async getVolunteersNearby(
    @Query('location') location: string,
    @Query('range') range: number,
  ) {
    const [latitude, longitude] = location.split(',').map(Number);
    return this.communityService.getVolunteersNearby(
      latitude,
      longitude,
      range,
    );
  }
}
