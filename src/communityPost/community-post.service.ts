import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommunityPost } from '../models/CommunityPost';
import { PostComment } from '../models/PostComment';
import { PostLike } from '../models/PostLike';
import { CommentLike } from '../models/CommentLike';
import { CommentReply } from '../models/CommentReply';
import { FileService } from '../files/file.service';
import { User } from '../models/User';
import { UserInteraction } from '../models/UserInteractions';
import { Op, literal } from 'sequelize';

type PostResponse = CommunityPost & {
  wasLiked: boolean;
};

interface FindAllParams {
  status?: string;
  userId?: number;
  offset?: number;
  limit?: number;
}

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
    @InjectModel(UserInteraction)
    private userInteractionModel: typeof UserInteraction,
    @InjectModel(User)
    private userModel: typeof User,
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

      await this.updateUserInteraction('post', createPostDto.userId);

      return await this.communityPostModel.create(postData);
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  async findAll(params: FindAllParams) {
    const { status, userId, offset = 0, limit = 5 } = params;
    const postsData = await this.communityPostModel.findAll({
      where: {
        status: status || 'active',
      },
      include: [
        {
          model: PostLike,
          as: 'likes',
          attributes: ['userId'],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    const posts = postsData.map((post) => {
      const rawPost = post.toJSON();
      console.log('Processing post:', post.id);
      console.log('Post likes:', rawPost.likes);
      const wasLiked =
        rawPost.likes?.some((like) => {
          console.log('Comparing:', Number(like.userId), Number(userId));
          return Number(like.userId) === Number(userId);
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

    return posts;
  }
  async findAllmyPost(params: FindAllParams) {
    const { status, userId, offset = 0, limit = 5 } = params;
    const postsData = await this.communityPostModel.findAll({
      where: {
        status: status || 'active',
        isDeleted: false,
        userId: userId,
      },
      include: [
        {
          model: PostLike,
          as: 'likes',
          attributes: ['userId'],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });
    const userData = await this.userModel.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'businessName'],
    });
    const posts = postsData.map((post) => {
      const rawPost = post.toJSON();
      console.log('Processing post:', post.id);
      console.log('Post likes:', rawPost.likes);
      const wasLiked =
        rawPost.likes?.some((like) => {
          console.log('Comparing:', Number(like.userId), Number(userId));
          return Number(like.userId) === Number(userId);
        }) || false;
      console.log('wasLiked value:', wasLiked);

      const transformedPost = {
        ...rawPost,
        wasLiked,
      } as PostResponse & { user: typeof userData };

      console.log(
        'Transformed post:',
        JSON.stringify(transformedPost, null, 2),
      );
      return transformedPost;
    });

    return { posts, user: userData };
  }

  async deletePost(postId: number, userId: number) {
    // First find the post to get media URLs
    const post = await this.communityPostModel.findOne({
      where: { id: postId, userId: userId },
    });

    if (!post) {
      throw new NotFoundException('Post not found or unauthorized');
    }

    // Delete associated media files if they exist and don't start with 'http'
    // if (post.mediaUrls && Array.isArray(post.mediaUrls)) {
    //   const deletePromises = post.mediaUrls
    //     .filter((url) => typeof url === 'string' && !url.startsWith('http'))
    //     .map((url) => this.fileService.deleteFile(url));

    //   if (deletePromises.length > 0) {
    //     await Promise.all(deletePromises);
    //   }
    // }

    // Update post status
    return this.communityPostModel.update(
      { status: 'Inactive', isDeleted: true, deletedAt: new Date() },
      { where: { id: postId, userId: userId } },
    );
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

    await this.updateUserInteraction('like', userId);

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

    await this.updateUserInteraction('unlike', userId);

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

    await this.updateUserInteraction('comment', userId);

    return comment;
  }

  async getComments(postId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    return this.postCommentModel.findAll({
      where: { postId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: offset,
    });
  }

  async deleteComment(commentId: number, userId: number, postId: number) {
    // First find the post
    const post = await this.communityPostModel.findByPk(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Delete the comment
    const result = await this.postCommentModel.destroy({
      where: { id: commentId, userId: userId, postId: postId },
    });

    if (result > 0) {
      await post.decrement('commentsCount', { by: 1 });
    }

    return result;
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

  async getUserInteraction(userId: number) {
    // Fetch the user along with their daily interaction data
    const user = await this.userModel.findOne({
      where: {
        id: userId,
      },
      include: [
        {
          model: UserInteraction,
          where: {
            date: {
              [Op.gte]: new Date().toISOString().split('T')[0], // Filters for today's interactions
            },
          },
          required: false, // Allow user to be returned even if no interactions found
          attributes: ['usedLikeCount', 'usedCommentCount', 'usedPostCount'],
        },
      ],
      attributes: [
        'id',
        'name',
        'email',
        'dailyLikeLimit',
        'dailyCommentLimit',
        'dailyPostLimit',
      ],
    });

    if (!user) {
      return null; // Or handle the case where the user is not found
    }

    // Extract user interaction data (defaults to 0 if no interactions found)
    const userInteraction = user.userInteractions?.[0] || {
      // Corrected here: `userInteractions`
      usedLikeCount: 0,
      usedCommentCount: 0,
      usedPostCount: 0,
    };

    return {
      // User values
      dailyLikeLimit: user.dailyLikeLimit,
      dailyCommentLimit: user.dailyCommentLimit,
      dailyPostLimit: user.dailyPostLimit,

      // UserInteraction values
      usedLikeCount: userInteraction.usedLikeCount,
      usedCommentCount: userInteraction.usedCommentCount,
      usedPostCount: userInteraction.usedPostCount,
    };
  }

  async updateUserInteraction(type: string, userId: number) {
    // Find or create a user interaction record
    const [userInteraction] = await this.userInteractionModel.findOrCreate({
      where: { userId, date: new Date().toISOString().split('T')[0] },
      defaults: {
        userId,
        usedLikeCount: 0,
        usedCommentCount: 0,
        usedPostCount: 0,
        date: new Date().toISOString().split('T')[0],
      },
    });

    // Increment the appropriate field
    if (type === 'like') {
      await userInteraction.increment('usedLikeCount', { by: 1 });
    } else if (type === 'comment') {
      await userInteraction.increment('usedCommentCount', { by: 1 });
    } else if (type === 'post') {
      await userInteraction.increment('usedPostCount', { by: 1 });
    } else if (type === 'unlike') {
      // Check if the count is greater than 0 before decrementing
      if (userInteraction.usedLikeCount > 0) {
        await userInteraction.decrement('usedLikeCount', { by: 1 });
      }
    }
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

  async getRelevantPosts(
    userId: number,
    userLat: number,
    userLong: number,
    page: number = 1,
    pageSize: number = 5,
    maxDistanceKm: number = 1000, // Maximum distance to consider
    timeWeightFactor: number = 0.6, // Weight for time relevance (0-1)
    distanceWeightFactor: number = 0.4, // Weight for distance relevance (0-1)
  ) {
    const offset = (page - 1) * pageSize;

    // Calculate time decay factor (posts older than 30 days start losing relevance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // When using ST_X(location) and ST_Y(location), ST_X returns longitude and ST_Y returns latitude.
    try {
      console.log('relevent post finding');
      // Using Haversine formula to calculate distance
      const posts = await this.communityPostModel.findAll({
        attributes: [
          'id',
          'title',
          'description',
          'createdAt',
          'mediaUrls',
          'userId',
          'status',
          'tags',
          'likesCount',
          'commentsCount',
          'sharesCount',
          'priority',
          'videoUrl',
          'postType',
          'userName',
          'isBusinessPost',
          [
            literal(`(
                6371 * acos(
                  cos(radians(${userLat})) * 
                  cos(radians(ST_Y(location))) * 
                  cos(radians(${userLong}) - radians(ST_X(location))) + 
                  sin(radians(${userLat})) * 
                  sin(radians(ST_Y(location)))
                )
              )
            `),
            'distance',
          ],
          [
            literal(`
              CASE 
                WHEN created_at > DATE_SUB(NOW(), INTERVAL 30 DAY) 
                THEN 1 
                ELSE EXP(-DATEDIFF(NOW(), created_at) / 30)
              END
            `),
            'timeRelevance',
          ],
          [
            literal(`(
              SELECT COUNT(id) FROM post_likes
              WHERE postId = CommunityPost.id AND userId = ${userId}
              Limit 1
            )`),
            'wasLiked',
          ],
        ],
        where: literal(`
          (
            6371 * acos(
              cos(radians(${userLat})) * 
              cos(radians(ST_Y(location))) * 
              cos(radians(${userLong}) - radians(ST_X(location))) + 
              sin(radians(${userLat})) * 
              sin(radians(ST_Y(location)))
            )
          ) <= ${maxDistanceKm} AND status = 'active'
        `),
        // include: [
        //   {
        //     model: PostLike,
        //     as: 'likes',
        //     attributes: ['id'],
        //     required: false,
        //     where: { userId: userId },
        //     limit: 1,
        //   },
        // ],
        order: [
          [
            literal(`
              (
                ${timeWeightFactor} * timeRelevance + 
                ${distanceWeightFactor} * (1 - (distance / ${maxDistanceKm}))
              )
            `),
            'DESC',
          ],
        ],
        limit: typeof pageSize === 'string' ? parseInt(pageSize) : pageSize,
        offset: offset,
      });

      // Calculate total count for pagination
      // const totalCount = await this.communityPostModel.count({
      //   where: literal(`
      //     (
      //       6371 * acos(
      //         cos(radians(${userLat})) *
      //         cos(radians(ST_X(location))) *
      //         cos(radians(${userLong}) - radians(ST_Y(location))) +
      //         sin(radians(${userLat})) *
      //         sin(radians(ST_X(location)))
      //       )
      //     ) <= ${maxDistanceKm}
      //   `),
      // });
      // return {
      //   posts,
      //   pagination: {
      //     currentPage: page,
      //     pageSize,
      //     totalPages: Math.ceil(totalCount / pageSize),
      //     totalCount,
      //   },
      // };

      return posts;
    } catch (error) {
      console.log(`Failed to fetch relevant posts: ${error.message}`);
      return [];
    }
  }

  async getPostLikes(postId: number, page: number, limit: number) {
    try {
      // Convert page and limit to numbers and set defaults if needed
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 5;
      const offset = (pageNumber - 1) * limitNumber;

      const result = await this.postLikeModel.findAndCountAll({
        where: { postId },
        include: [
          {
            model: this.userModel,
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: limitNumber, // Using the converted number
        offset: offset, // Calculate offset based on page and limit
      });

      return {
        likes: result.rows,
        total: result.count,
        page: pageNumber,
        pageSize: limitNumber,
        totalPages: Math.ceil(result.count / limitNumber),
      };
    } catch (error) {
      console.error('Error fetching post likes:', error);
      throw new Error('Failed to fetch post likes');
    }
  }
}
