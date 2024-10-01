import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
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
    @Query('duration') duration: number,
  ) {
    return this.sosService.getSOSEvents(eventType, duration);
  }
}
