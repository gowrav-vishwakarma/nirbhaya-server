import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommunityPost } from '../models/CommunityPost';
import { PostComment } from '../models/PostComment';
import { PostLike } from '../models/PostLike';
import { CommentLike } from '../models/CommentLike';
import { CommentReply } from '../models/CommentReply';
import { FileService } from '../files/file.service';
import { User } from '../models/User';

type PostResponse = CommunityPost & {
  wasLiked: boolean;
};

@Injectable()
export class CommunityPostService {
  constructor(
    @InjectModel(CommunityPost)
    private communityPostModel: typeof CommunityPost,
    @InjectModel(PostLike)
    private postLikeModel: typeof PostLike,
    @InjectModel(PostComment)
    private postCommentModel: typeof PostComment,
    @InjectModel(CommentLike)
    private commentLikeModel: typeof CommentLike,
    @InjectModel(CommentReply)
    private commentReplyModel: typeof CommentReply,
    private readonly fileService: FileService,
  ) {}

  async create(createPostDto: any, files: Array<Express.Multer.File>) {
    try {
      const imageUrls = await this.imageUpload(files, createPostDto.userId);

      // Parse the location string into a GeoJSON object
      let location = null;
      if (createPostDto.location) {
        const locationObj = JSON.parse(createPostDto.location);
        location = {
          type: 'Point',
          coordinates: locationObj.coordinates,
        };
      }

      // Parse tags if it's a string
      let tags = createPostDto.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch {
          tags = [];
        }
      }

      const postData = {
        ...createPostDto,
        mediaUrls: imageUrls,
        location: location,
        tags: tags,
      };

      console.log('postData.......', postData);

      return await this.communityPostModel.create(postData);
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  async findAll(options: any) {
    console.log('userId.......1111111111111', options.userId);

    const posts = await this.communityPostModel.findAll({
      where: {
        status: options.status || 'active',
      },
      include: [
        {
          model: PostLike,
          as: 'likes',
          attributes: ['userId'],
        },
        // {
        //   model: PostComment,
        //   as: 'comments',
        // },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (options.userId) {
      console.log('Processing posts for userId:', options.userId);
      const postsWithLikeStatus = posts.map((post) => {
        const rawPost = post.toJSON();
        console.log('Processing post:', post.id);
        console.log('Post likes:', rawPost.likes);
        const wasLiked =
          rawPost.likes?.some((like) => {
            console.log(
              'Comparing:',
              Number(like.userId),
              Number(options.userId),
            );
            return Number(like.userId) === Number(options.userId);
          }) || false;
        console.log('wasLiked value:', wasLiked);

        const transformedPost = {
          ...rawPost,
          wasLiked,
        } as PostResponse;

        console.log(
          'Transformed post:',
          JSON.stringify(transformedPost, null, 2),
        );
        return transformedPost;
      });

      return postsWithLikeStatus;
    }

    return posts;
  }

  async likePost(postId: number, userId: number) {
    const post = await this.communityPostModel.findByPk(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.postLikeModel.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      await this.unlikePost(postId, userId);
    }

    await this.postLikeModel.create({ postId, userId });
    await post.increment('likesCount', { by: 1 });

    return { message: 'Post liked successfully' };
  }

  async unlikePost(postId: number, userId: number) {
    const post = await this.communityPostModel.findByPk(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const like = await this.postLikeModel.findOne({
      where: { postId, userId },
    });

    if (!like) {
      throw new Error('Post not liked');
    }

    await like.destroy();
    await post.decrement('likesCount', { by: 1 });

    return { message: 'Post unliked successfully' };
  }

  async addComment(postId: number, content: string, userId: number) {
    const post = await this.communityPostModel.findByPk(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.postCommentModel.create({
      postId,
      userId,
      content,
      likesCount: 0,
      repliesCount: 0,
    });

    await post.increment('commentsCount', { by: 1 });

    return comment;
  }

  async getComments(postId: number) {
    return this.postCommentModel.findAll({
      where: { postId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  async likeComment(commentId: number, userId: number) {
    const comment = await this.postCommentModel.findByPk(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.commentLikeModel.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      throw new Error('Comment already liked');
    }

    await this.commentLikeModel.create({ commentId, userId });
    await comment.increment('likesCount', { by: 1 });

    return { message: 'Comment liked successfully' };
  }

  async unlikeComment(commentId: number, userId: number) {
    const comment = await this.postCommentModel.findByPk(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const like = await this.commentLikeModel.findOne({
      where: { commentId, userId },
    });

    if (!like) {
      throw new Error('Comment not liked');
    }

    await like.destroy();
    await comment.decrement('likesCount', { by: 1 });

    return { message: 'Comment unliked successfully' };
  }

  async addReply(commentId: number, content: string, userId: number) {
    const comment = await this.postCommentModel.findByPk(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const reply = await this.commentReplyModel.create({
      commentId,
      userId,
      content,
    });

    await comment.increment('repliesCount', { by: 1 });

    return reply;
  }

  async getReplies(commentId: number) {
    return this.commentReplyModel.findAll({
      where: { commentId },
      include: ['user'],
      order: [['createdAt', 'DESC']],
    });
  }

  async deleteReply(replyId: number, userId: number) {
    const reply = await this.commentReplyModel.findOne({
      where: { id: replyId, userId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found or unauthorized');
    }

    const comment = await this.postCommentModel.findByPk(reply.commentId);
    await reply.destroy();
    await comment.decrement('repliesCount', { by: 1 });

    return { message: 'Reply deleted successfully' };
  }

  private async imageUpload(
    files: Array<Express.Multer.File>,
    userId: number,
  ): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const uploadPromises = files.map(async (file) => {
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      return this.fileService.uploadFile(
        `community-posts/post/${userId}`,
        uniqueFileName,
        file,
      );
    });

    return Promise.all(uploadPromises);
  }
}
