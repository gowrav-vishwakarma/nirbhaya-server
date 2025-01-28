import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { BeforeHookParams } from 'src/qnatk/src/dto/Hooks.dto';
import { NirbhayaQnatkControllerService } from 'src/nirbhaya-qnatk-controller.service';
import { Transaction } from 'sequelize';
import { CommunityPost } from 'src/models/CommunityPost';
import { InjectModel } from '@nestjs/sequelize';
import { PostComment } from 'src/models/PostComment';
import { PostLike } from 'src/models/PostLike';
import { FileService } from 'src/files/file.service';

@Injectable()
export class BeforeDeleteTestUSerCheckExecuteHook extends BaseHook {
  constructor(
    private readonly nirbhayaQnatkControllerService: NirbhayaQnatkControllerService,
    @InjectModel(CommunityPost)
    private readonly communityPostModel: typeof CommunityPost,
    @InjectModel(PostComment)
    private readonly postCommentModel: typeof PostComment,
    @InjectModel(PostLike)
    private readonly postLike: typeof PostLike,
    private readonly fileService: FileService,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
  ): Promise<BeforeHookParams<any, any>> {
    if (previousData.data.primaryKey == '118') {
      throw new BadRequestException('Test user cannot be deleted');
    }
    return previousData;
  }
}
