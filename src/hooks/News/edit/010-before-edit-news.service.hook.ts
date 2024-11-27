import { Injectable } from '@nestjs/common';
import { FileService } from 'src/files/file.service';
import { GlobalService } from 'src/global/global.service';
import { BeforeHookParamsWithFiles } from 'src/qnatk/src/dto/Hooks.dto';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';

@Injectable()
export class SosCreateHook extends BaseHook {
  constructor(
    private readonly globalService: GlobalService,
    private readonly fileService: FileService,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParamsWithFiles<any, any>,
  ): Promise<BeforeHookParamsWithFiles<any, any>> {
    console.log('previousData.files...........', previousData);
    if (
      previousData.data?.imageSourceUrl === 'null' ||
      previousData.data?.imageSourceUrl === 'undefined'
    ) {
      previousData.data.imageSourceUrl = null;
    }
    if (previousData?.files?.length && previousData.data.imageSourceUrl) {
      throw new ValidationException({
        message: ['Either upload image or provide image source url'],
      });
    }
    if (previousData?.data?.imageSourceUrl) {
      console.log(
        'previousData.data.imageSourceUrl',
        previousData.data.imageSourceUrl,
      );
      previousData.data.mediaUrls = [previousData.data.imageSourceUrl];
    }

    if (previousData?.files && previousData.files.length > 0) {
      const filePathArray = [];
      for (let index = 0; index < previousData.files.length; index++) {
        const uniqueValue = this.globalService.generateRandomString();
        const image = previousData.files[index];
        console.log('type of image', typeof image);
        const filePath = await this.fileService.uploadFile(
          `uploads/news/`,
          `${image.fieldname}_${uniqueValue}`,
          image,
        );
        filePathArray.push(filePath);
        console.log('filePath:', image, filePath);
      }
      previousData.data.mediaUrls = filePathArray;

      if (previousData.data.categories) {
        previousData.data.categories = JSON.parse(previousData.data.categories);
      }
      if (previousData.data.locations) {
        previousData.data.locations = JSON.parse(previousData.data.locations);
      }
      if (previousData.data.tags) {
        previousData.data.tags = JSON.parse(previousData.data.tags);
      }
    }
    delete previousData.data.imageSourceUrl;
    return previousData;
  }
}
