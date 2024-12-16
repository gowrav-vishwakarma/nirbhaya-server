import { Injectable } from '@nestjs/common';
import { BaseHook } from 'src/qnatk/src/hooks/base-hook';
import { BeforeHookParams } from 'src/qnatk/src/dto/Hooks.dto';
import { CommunityPost } from 'src/models/CommunityPost';
import { InjectModel } from '@nestjs/sequelize';
import { FileService } from 'src/files/file.service';
import { PostComment } from 'src/models/PostComment';
import { PostLike } from 'src/models/PostLike';
import { Transaction } from 'sequelize';
@Injectable()
export class BeforeDeleteExecuteHook extends BaseHook {
  constructor(
    @InjectModel(CommunityPost)
    private readonly communityPostModel: typeof CommunityPost,
    private readonly fileService: FileService,
    @InjectModel(PostComment)
    private readonly postCommentModel: typeof PostComment,
    @InjectModel(PostLike)
    private readonly postLike: typeof PostLike,
  ) {
    super();
  }
  async execute(
    previousData: BeforeHookParams<any, any>,
    transaction: Transaction,
  ): Promise<BeforeHookParams<any, any>> {
    console.log('previousData........... community post', previousData);
    if (previousData.data.primaryKey) {
      const postData = await this.communityPostModel.findOne({
        where: {
          id: Number(previousData.data.primaryKey),
        },
      });
      if (postData) {
        await this.postCommentModel.destroy({
          where: {
            postId: postData.id,
          },
          transaction,
        });
        await this.postLike.destroy({
          where: {
            postId: postData.id,
          },
          transaction,
        });
        if (postData.mediaUrls && postData.mediaUrls.length > 0) {
          for (const i of postData.mediaUrls) {
            await this.fileService.deleteFile('public/' + i);
          }
        }
        console.log('completed this ?');
      }
    }
    return previousData;
  }
}
