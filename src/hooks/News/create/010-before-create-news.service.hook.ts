import { Injectable } from '@nestjs/common';
import { BeforeHookParamsWithFiles } from 'src/qnatk/src/dto/Hooks.dto';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { GlobalService } from 'src/global/global.service';
import { FileService } from 'src/files/file.service';
import { NewsTranslation } from 'src/models/NewsTranslation';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'aws-sdk/clients/managedblockchainquery';
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
    console.log('previousData.files...........', previousData);
    if (previousData.data.categories) {
      previousData.data.categories = JSON.parse(previousData.data.categories);
    }

    if (previousData.files && previousData.files.length > 0) {
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
    }

    await this.newsTranslationModel.create({
      newsId: previousData.data.id,
      languageCode: previousData.data.defaultLanguage,
      title: previousData.data.title,
      content: previousData.data.content,
    });
    return previousData;
  }
}
