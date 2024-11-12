import { Injectable } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class FileService {
  private publicFolder = 'public/';
  private DigitaloceanS3: S3Client;
  private awsS3: AWS.S3;
  constructor(private configService: ConfigService) {
    this.publicFolder = this.configService.get('S3_PUBLIC_FOLDER') + '/';

    // AWS S3
    this.awsS3 = new AWS.S3({
      endpoint: this.configService.get('S3_ENDPOINT'),
      region: this.configService.get('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      },
    });

    //DigitaloceanS3
    this.DigitaloceanS3 = new S3Client({
      forcePathStyle: true, // Configures to use subdomain/virtual calling format.
      endpoint: this.configService.get('S3_ENDPOINT'),
      region: this.configService.get('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESSS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      },
    });
  }

  async uploadFile(
    uploadPath: string,
    filename: string,
    file: Express.Multer.File,
  ) {
    console.log('file............');

    if (this.configService.get('USE_LOCAL_FILE_SYSTEM') === 'true') {
      return this.uploadFileLocal(uploadPath, filename, file);
    } else {
      return this.uploadFileDigitaloceanS3(uploadPath, filename, file);
    }
  }

  async uploadFileDigitaloceanS3(
    uploadPath: string,
    filename: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const publicUploadPath = uploadPath;
    console.log('eeeeeeeeeeeeeeeeeeeeee', file);

    const fileExtension = path.extname(file.originalname);

    // Construct the full file path
    const filePath = path.join(publicUploadPath, `${filename}${fileExtension}`);

    const command = new PutObjectCommand({
      Bucket: this.configService.get('BUCKET_SPACE_NAME'),
      Key: filePath,
      Body: file.buffer,
      ACL: 'public-read',
    });
    try {
      const res = await this.DigitaloceanS3.send(command);
      console.log('res:', res);
    } catch (err) {
      console.error('Error uploading file:', err);
    }
    // Construct the URL of the uploaded object
    const objectUrl = `${filePath}`;
    return objectUrl;
  }

  async uploadFileAwsS3(
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

    const { Location } = await this.awsS3.upload(params).promise();
    console.log('Location', Location);
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
      return this.deleteFileDigitaloceanS3(filePath);
    }
  }

  async deleteFileLocal(filePath: string): Promise<void> {
    await fsPromises.rm(filePath);
  }

  async deleteFileAwsS3(filePath: string) {
    const params = {
      Bucket: this.configService.get('S3_BUCKET'),
      Key: filePath,
    };
    const response = this.awsS3.deleteObject(params, (err, data) => {
      if (err) {
        console.error('Error deleting data', data);
        console.error('Error deleting file', err);
      }
    });
    console.log('response', response);
    return response;
  }

  async deleteFileDigitaloceanS3(filePath: string): Promise<boolean> {
    const params = {
      Bucket: this.configService.get('S3_BUCKET'),
      Key: filePath,
    };

    try {
      const command = new DeleteObjectCommand(params);
      await this.DigitaloceanS3.send(command);
      console.log('File deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
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
