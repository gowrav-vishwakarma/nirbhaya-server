import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { FileService } from './file.service';

@Controller('files')
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('/upload')
  @UseInterceptors(AnyFilesInterceptor())
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    console.log('files....', files);
    console.log('Uploading  file', body);

    console.log('before timeout', new Date().getSeconds());
    console.log('after timeout', new Date().getSeconds());

    const response = await this.fileService.uploadFile(
      body.filePath,
      `signature_${new Date().toISOString().replace(/[:.-]/g, '')}`, // Creates a unique date-time string
      files[0],
    );

    console.log('Response...', response);

    // Process responses here
    return {
      url: response,
    };
  }
}
