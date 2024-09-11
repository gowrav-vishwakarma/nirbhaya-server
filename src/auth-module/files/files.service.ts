import { Injectable } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';

@Injectable()
export class FilesService {
  private publicFolder = 'public/';
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    this.publicFolder = this.configService.get('S3_PUBLIC_FOLDER') + '/';
    this.s3 = new AWS.S3({
      endpoint: this.configService.get('S3_ENDPOINT'),
      credentials: new AWS.Credentials({
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      }),
      region: this.configService.get('S3_REGION'),
    });
  }

  async uploadFile(
    uploadPath: string,
    filename: string,
    file: Express.Multer.File,
  ) {
    if (this.configService.get('USE_LOCAL_FILE_SYSTEM') === 'true') {
      return this.uploadFileLocal(uploadPath, filename, file);
    } else {
      return this.uploadFileS3(uploadPath, filename, file);
    }
  }

  async uploadFileS3(
    uploadPath: string,
    filename: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const publicUploadPtah = this.publicFolder + uploadPath;
    const fileExtension = path.extname(file.originalname);

    // Construct the full file path
    const filePath = path.join(publicUploadPtah, `${filename}${fileExtension}`);

    const params = {
      Bucket: this.configService.get('S3_BUCKET'),
      Key: filePath,
      Body: file.buffer,
      ACL: 'public-read',
    };

    const { Location } = await this.s3.upload(params).promise();
    // console.log('Location', Location);
    return filePath;
  }

  async uploadFileLocal(
    uploadPath: string,
    filename: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const publicUploadPtah = this.publicFolder + uploadPath;
    // Ensure that the directory exists
    await this.ensureDirectoryExistence(publicUploadPtah);

    // Extracting the file extension from the original file
    const fileExtension = path.extname(file.originalname);

    // Construct the full file path
    const filePath = path.join(publicUploadPtah, `${filename}${fileExtension}`);

    try {
      // Write the file
      await fsPromises.writeFile(filePath, file.buffer);
      return filePath.replace('public/', '');
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async copyFile(
    source: string,
    destinationPath: string,
    filename: string,
  ): Promise<string> {
    const publicSourcePath = this.publicFolder + source;
    const publicDestinationPath = this.publicFolder + destinationPath;

    // Ensure that the directory exists
    await this.ensureDirectoryExistence(publicDestinationPath);

    // Extracting the file extension from the original file
    const fileExtension = path.extname(publicSourcePath);

    // Construct the full file path
    const filePath = path.join(
      publicDestinationPath,
      `${filename}${fileExtension}`,
    );

    try {
      // Write the file
      await fsPromises.copyFile(publicSourcePath, filePath);
      // remove public folder from path
      return filePath.replace('public/', '');
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  async deleteFile(filePath: string) {
    if (this.configService.get('USE_LOCAL_FILE_SYSTEM') === 'true') {
      return this.deleteFileLocal(filePath);
    } else {
      return this.deleteFileS3(filePath);
    }
  }

  async deleteFileLocal(filePath: string): Promise<void> {
    await fsPromises.rm(filePath);
  }

  async deleteFileS3(filePath: string) {
    const params = {
      Bucket: this.configService.get('S3_BUCKET'),
      Key: filePath,
    };
    const response = this.s3.deleteObject(params, (err, data) => {
      if (err) {
        console.error('Error deleting file', err);
      }
      // console.log('Data', data);
    });
    // console.log('response', response);
    return response;
  }

  private async ensureDirectoryExistence(filePath: string): Promise<void> {
    // console.log('filePath', filePath);
    try {
      await fsPromises.access(filePath);
    } catch (error) {
      console.error(`Directory does not exist, creating: ${filePath}`, error);
      await fsPromises.mkdir(filePath, { recursive: true });
    }
  }
}
