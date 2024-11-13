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
  BadRequestException,
  Put,
  UploadedFiles,
} from '@nestjs/common';
import { IncidentService } from './incident.service';
import { AuthGuard } from 'src/auth-module/auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

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
    console.log('createIncidentDto..', createIncidentDto);

    return this.incidentService.create({
      ...createIncidentDto,
      latitude,
      longitude,
      userId: req.user.id,
    });
  }
  @Post('like-incident')
  async likeIncident(@Body() likeIncidentDto: any) {
    console.log('likeIncidentDto..', likeIncidentDto);
    return this.incidentService.likeIncident(likeIncidentDto);
  }
  @Post('add-comment')
  async createIncidentComments(@Body() comment: any) {
    console.log('comment..', comment);
    return this.incidentService.createIncidentComments(comment);
  }
  @Get('reels-comments')
  async getReelComments(
    @Query('incidentId') incidentId: string,
    @Query('limit') limit: number,
  ) {
    return await this.incidentService.getIncidentComments(
      Number(incidentId),
      Number(limit),
    );
  }
  @Post('log-share')
  async createlogshare(@Body() share: any) {
    console.log('comment..', share);
    return this.incidentService.createlogshare(share);
  }
  @Get('check-like')
  async checkLike(
    @Query('userId') userId: string,
    @Query('incidentId') incidentId: string,
  ) {
    console.log('Received check-like request with:', { userId, incidentId });

    if (!userId || !incidentId) {
      console.error('Missing userId or incidentId in query parameters');
      return;
    }

    return this.incidentService.checkLike(userId, incidentId);
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

  @Post('image-upload')
  @UseInterceptors(AnyFilesInterceptor())
  async imageUpload(@UploadedFiles() files: Array<Express.Multer.File>) {
    console.log('Received files:', files);
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.incidentService.imageUpload(files);
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
