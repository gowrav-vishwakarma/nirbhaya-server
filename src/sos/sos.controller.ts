import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { SosService } from './sos.service';
import { AuthGuard } from '../auth-module/auth.guard';
import { GetUser } from '../auth-module/getuser.decorator';
import { UserJWT } from '../dto/user-jwt.dto';

@Controller('sos')
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post('/sos-update')
  @UseGuards(AuthGuard)
  sosUpdate(@Body() data: any, @GetUser() user: UserJWT): Promise<any> {
    return this.sosService.sosUpdate(data, user);
  }

  @Get('get-presigned-url')
  @UseGuards(AuthGuard)
  async getPresignedUrl(
    @Query('sosEventId') sosEventId: number,
    @Query('fileName') fileName: string,
    @Query('contentType') contentType: string,
  ) {
    const presignedUrl = await this.sosService.getPresignedUrlForUpload(
      sosEventId,
      fileName,
      contentType,
    );
    return { presignedUrl };
  }

  @Get('sos-events')
  @UseGuards(AuthGuard)
  async getSOSEvents(
    @Query('eventType') eventType: string,
    @Query('timeRange') timeRange: string,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sosService.getSOSEvents(
      eventType,
      timeRange,
      latitude,
      longitude,
      radius,
      startDate,
      endDate,
    );
  }

  // @UseGuards(AuthGuard)
  @Get('sos-accepted-users')
  @UseGuards(AuthGuard)
  async getSosAcceptedUsers(
    @Query('userId') userId: number,
    @Query('eventId') eventId: number,
  ) {
    console.log('userId...........', userId);
    const data = { userId, eventId };
    return this.sosService.getNotificationsByUserId(data);
  }

  @Post('feedback')
  @UseGuards(AuthGuard)
  async createAndUpdateFeedback(@Body('feedBackData') feedbackData: any) {
    console.log('feedbackData..........', feedbackData);
    return this.sosService.createAndUpdateFeedback(feedbackData);
  }
}
