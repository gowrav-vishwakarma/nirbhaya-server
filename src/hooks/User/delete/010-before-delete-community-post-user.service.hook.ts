import { Injectable } from '@nestjs/common';
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
export class BeforeDeleteExecuteHook extends BaseHook {
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
    transaction: Transaction,
  ): Promise<BeforeHookParams<any, any>> {
    console.log('previousData...........', previousData);
    if (previousData.data.primaryKey) {
      const postData = await this.communityPostModel.findAll({
        where: {
          userId: Number(previousData.data.primaryKey),
        },
      });
      if (postData && postData.length) {
        for (const data of postData) {
          //   await this.nirbhayaQnatkControllerService.executeAction(
          //     'CommunityPost',
          //     'delete',
          //     { primaryKey: data.id },
          //     previousData.user,
          //     true,
          //     transaction,
          //   );
          await this.postCommentModel.destroy({
            where: {
              postId: data.id,
            },
            transaction,
          });
          await this.postLike.destroy({
            where: {
              postId: data.id,
            },
            transaction,
          });
          await this.communityPostModel.destroy({
            where: {
              id: data.id,
            },
            transaction,
          });
          if (data.mediaUrls && data.mediaUrls.length > 0) {
            for (const i of data.mediaUrls) {
              await this.fileService.deleteFile('public/' + i);
            }
          }
        }
      }
    }
    return previousData;
  }
}
