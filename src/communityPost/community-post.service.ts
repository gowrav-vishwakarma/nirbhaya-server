import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommunityPost } from '../models/CommunityPost';
import { User } from '../models/User';
import { Comment } from '../models/Comments';
import { FileService } from '../files/file.service';

@Injectable()
export class CommunityPostService {
  constructor(
    @InjectModel(CommunityPost)
    private communityPostModel: typeof CommunityPost,
    private readonly fileService: FileService,
  ) {}

  async imageUpload(
    files: Array<Express.Multer.File>,
    userId,
  ): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      const filePath = await this.fileService.uploadFile(
        `community-posts/post/${userId}`,
        uniqueFileName,
        file,
      );
      return filePath;
    });

    return Promise.all(uploadPromises);
  }

  async create(
    createPostDto: any,
    files: Array<Express.Multer.File>,
  ): Promise<CommunityPost> {
    try {
      const imageUrls = await this.imageUpload(files, createPostDto.userId);

      // Parse location if it's a string
      let location = createPostDto.location;
      if (typeof location === 'string') {
        location = JSON.parse(location);
      }

      // Handle tags
      let tags: string[] = [];
      if (createPostDto.tags) {
        if (typeof createPostDto.tags === 'string') {
          try {
            tags = JSON.parse(createPostDto.tags);
          } catch {
            tags = createPostDto.tags.split(',').map((tag) => tag.trim());
          }
        } else if (Array.isArray(createPostDto.tags)) {
          tags = createPostDto.tags;
        }
      }

      const postData = {
        ...createPostDto,
        mediaUrls: imageUrls,
        sequence: 10,
        location: {
          type: 'Point',
          coordinates: location?.coordinates || [0, 0],
        },
        tags: tags,
      };

      return await this.communityPostModel.create(postData);
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  async findAll(query: any = {}) {
    const { offset = 0, limit = 10 } = query;

    const posts = await this.communityPostModel.findAll({
      where: {
        status: 'active',
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return posts.map((post) => {
      const plainPost = post.get({ plain: true });
      // Ensure tags is always an array, even if it comes as null or undefined
      plainPost.tags = plainPost.tags || [];
      return plainPost;
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
