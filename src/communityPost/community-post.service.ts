import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommunityPost } from '../models/CommunityPost';
import { User } from '../models/User';
// import { Like } from '../models/Likes';
import { Comment } from '../models/Comments';
// import { Share } from '../models/Shares';
import { Op } from 'sequelize';

@Injectable()
export class CommunityPostService {
  constructor(
    @InjectModel(CommunityPost)
    private communityPostModel: typeof CommunityPost,
  ) {}

  async create(createPostDto: any): Promise<CommunityPost> {
    return await this.communityPostModel.create(createPostDto);
  }

  async findAll(query: any = {}) {
    const { offset = 0, limit = 10 } = query;

    return await this.communityPostModel.findAll({
      where: {
        status: 'active',
      },

      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  }

  async findOne(id: number) {
    return await this.communityPostModel.findOne({
      where: { id },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'profilePic'],
        },
        // {
        //   model: Like,
        //   attributes: ['id', 'userId'],
        // },
        {
          model: Comment,
          attributes: ['id', 'comment', 'userId'],
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'profilePic'],
            },
          ],
        },
        // {
        //   model: Share,
        //   attributes: ['id', 'userId'],
        // },
      ],
    });
  }

  async update(id: number, updatePostDto: any) {
    const post = await this.communityPostModel.findByPk(id);
    if (!post) {
      throw new Error('Post not found');
    }
    return await post.update(updatePostDto);
  }
}
