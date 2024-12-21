import { Injectable } from '@nestjs/common';
import { BeforeHookParamsWithFiles } from 'src/qnatk/src/dto/Hooks.dto';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { GlobalService } from 'src/global/global.service';
import { FileService } from 'src/files/file.service';
import { NewsTranslation } from 'src/models/NewsTranslation';
import { InjectModel } from '@nestjs/sequelize';
@Injectable()
export class NewsCreateHook extends BaseHook {
  constructor(
    private readonly globalService: GlobalService,
    private readonly fileService: FileService,
    @InjectModel(NewsTranslation)
    private readonly newsTranslationModel: typeof NewsTranslation,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParamsWithFiles<any, any>,
  ): Promise<BeforeHookParamsWithFiles<any, any>> {
    console.log('previousData.files...........11111', previousData);
    if (previousData.files && previousData.files.length > 0) {
      const filePathArray = [];
      for (let index = 0; index < previousData.files.length; index++) {
        const uniqueValue = this.globalService.generateRandomString();
        const image = previousData.files[index];
        const filePath = await this.fileService.uploadFile(
          `uploads/communityPost/`,
          `${image.fieldname}_${uniqueValue}`,
          image,
        );
        filePathArray.push(filePath);
      }
      if (
        previousData.data.mediaUrls &&
        previousData.data.mediaUrls !== undefined &&
        previousData.data.mediaUrls !== 'undefined' &&
        previousData.data.mediaUrls.length > 0
      ) {
        previousData.data.mediaUrls = JSON.parse(previousData.data.mediaUrls);
        previousData.data.mediaUrls = [
          ...previousData.data.mediaUrls,
          ...filePathArray,
        ];
      } else {
        previousData.data.mediaUrls = filePathArray;
      }
      if (previousData.data.tags) {
        previousData.data.tags = JSON.parse(previousData.data.tags);
      }
      if (
        previousData.data?.videoUrl &&
        (previousData.data.videoUrl === 'undefined' ||
          previousData.data.videoUrl === undefined ||
          previousData.data.videoUrl === 'null')
      ) {
        previousData.data.videoUrl = null;
      }
    }
    if(previousData.data?.location){
      previousData.data.location = JSON.parse(previousData.data.location);
    }
    return previousData;
  }
}
