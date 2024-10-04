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
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/auth-module/auth.guard';

@Controller('incidents')
@UseGuards(AuthGuard)
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadIncident(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Body() createIncidentDto: any,
  ) {
    const videoUrl = `${process.env.BASE_URL}/uploads/${file.filename}`;
    return this.incidentService.create(
      { ...createIncidentDto, videoUrl },
      req.user.id,
    );
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
