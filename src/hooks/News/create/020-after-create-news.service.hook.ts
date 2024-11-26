import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AfterHookParamsWithFiles } from 'src/qnatk/src/dto/Hooks.dto';
import { BaseHook } from '../../../qnatk/src/hooks/base-hook';
import { Transaction } from 'sequelize';
import { NewsTranslation } from 'src/models/NewsTranslation';
@Injectable()
export class NewsTransalationCreate extends BaseHook {
  constructor(
    @InjectModel(NewsTranslation)
    private readonly newsTranslationModel: typeof NewsTranslation,
  ) {
    super();
  }
  async execute(
    previousData: AfterHookParamsWithFiles<any, any>,
    transaction: Transaction,
  ): Promise<AfterHookParamsWithFiles<any, any>> {
    console.log('previousData', previousData);
    if (previousData?.modelInstance.id) {
      await this.newsTranslationModel.create(
        {
          newsId: previousData.modelInstance.id,
          languageCode: previousData.data.defaultLanguage,
          title: previousData.data.title,
          content: previousData.data.content,
        },
        { transaction },
      );
    }
    return previousData;
  }
}
