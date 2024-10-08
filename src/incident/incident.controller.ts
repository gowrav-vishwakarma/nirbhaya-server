import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { IncidentService } from './incident.service';
import { AuthGuard } from 'src/auth-module/auth.guard';

@Controller('incidents')
@UseGuards(AuthGuard)
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post('upload')
  async uploadIncident(@Req() req, @Body() createIncidentDto: any) {
    // Ensure latitude and longitude are parsed as numbers
    const latitude = parseFloat(createIncidentDto.latitude);
    const longitude = parseFloat(createIncidentDto.longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid latitude or longitude');
    }

    return this.incidentService.create({
      ...createIncidentDto,
      latitude,
      longitude,
      userId: req.user.id,
    });
  }

  @Get('get-presigned-url')
  async getPresignedUrl(
    @Query('fileName') fileName: string,
    @Query('contentType') contentType: string,
  ) {
    const presignedUrl = await this.incidentService.getPresignedUrlForUpload(
      fileName,
      contentType,
    );
    return { presignedUrl };
  }

  @Get('reels')
  async getReels(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    const offset = (Number(page) - 1) * Number(pageSize);
    return this.incidentService.findAll({ limit: Number(pageSize), offset });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.incidentService.findOne(+id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.incidentService.remove(+id);
  }
}
