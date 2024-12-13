import { Injectable } from '@nestjs/common';
import {
  ActionExecuteWithFilesParams,
  AfterHookParamsWithFiles,
} from 'src/qnatk/src/dto/Hooks.dto';
import { BaseHook } from '../../../qnatk/src/hooks/base-hook';
import { ValidationException } from '../../../qnatk/src/Exceptions/ValidationException';
import { FileService } from 'src/files/file.service';
import { User } from 'src/models/User';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class ProfileImageChange extends BaseHook {
  constructor(
    private fileService: FileService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {
    super();
  }
  async execute(
    previousData: ActionExecuteWithFilesParams<any, any>,
    transaction: Transaction,
  ): Promise<AfterHookParamsWithFiles<any, any>> {
    if (!previousData.data.userId) {
      throw new ValidationException({
        UserId: ['user id required'],
      });
    }
    console.log('previousData.files', previousData.files);
    if (previousData.files && previousData.files.length) {
      console.log('previousData.files', previousData.files);
      const filePath = await this.fileService.uploadFile(
        `uploads/usersProfile/${previousData.data.userId}`,
        `${previousData.data.userId}_${previousData.data.referralId}`,
        previousData.files[0],
      );
      previousData.data['profileImage'] = filePath;
      if (filePath) {
        await this.userModel.update(
          {
            profileImage: filePath,
          },
          {
            where: {
              id: previousData.data.userId,
            },
            transaction,
          },
        );
      }
    }
    console.log('previous..dat', previousData.data);
    return previousData.data;
  }
}
