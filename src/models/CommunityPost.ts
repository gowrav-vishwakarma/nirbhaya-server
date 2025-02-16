import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './User';
import { PostLike } from './PostLike';
import { PostComment } from './PostComment';

export interface PostDataWithDistance extends CommunityPost {
  distance?: number;
  timeRelevance?: number;
  wasLiked?: boolean;
  searchRelevance?: number;
}

@Table({
  tableName: 'communityPosts',
  timestamps: true,
  indexes: [
    {
      type: 'FULLTEXT',
      name: 'post_search_idx',
      fields: ['title', 'description', 'tags'],
      parser: 'ngram',
    },
  ],
})
export class CommunityPost extends Model<CommunityPost> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'SOS Bharat Community',
  })
  userName?: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Column({
    type: DataType.TEXT,
    get() {
      if (
        typeof this.getDataValue('mediaUrls') === 'string' &&
        this.getDataValue('mediaUrls').startsWith('http')
      ) {
        return this.getDataValue('mediaUrls');
      }
      try {
        return JSON.parse(this.getDataValue('mediaUrls'));
      } catch {
        return this.getDataValue('mediaUrls') || [];
      }
    },
    set(value: string[]) {
      this.setDataValue('mediaUrls', JSON.stringify(value));
    },
  })
  mediaUrls: string[];

  @Column({
    type: DataType.STRING,
  })
  Position: string;

  @Column({
    type: DataType.TEXT,
    get() {
      const rawValue = this.getDataValue('locations');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value: string[]) {
      this.setDataValue('locations', JSON.stringify(value));
    },
  })
  locations: string[];

  @Column({
    type: DataType.GEOMETRY('POINT'),
    allowNull: true,
  })
  location: any;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  showLocation: boolean;

  @Column({
    type: DataType.STRING,
  })
  badge?: string;

  @Column({
    type: DataType.TEXT,
    get() {
      const rawValue = this.getDataValue('tags');
      if (!rawValue) return [];
      if (Array.isArray(rawValue)) return rawValue;
      try {
        return JSON.parse(rawValue);
      } catch {
        return [];
      }
    },
    set(value: string[]) {
      if (Array.isArray(value)) {
        this.setDataValue('tags', JSON.stringify(value));
      } else {
        this.setDataValue('tags', '[]');
      }
    },
    defaultValue: '[]',
  })
  tags: string[];

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  sharesCount: number;

  @Column({
    type: DataType.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'low',
  })
  priority: 'low' | 'medium' | 'high';

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  sequence: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  videoUrl?: string;

  @Column({
    type: DataType.ENUM('post', 'testimonial', 'other'),
    allowNull: false,
    defaultValue: 'post',
  })
  postType: 'post' | 'testimonial' | 'other';

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  likesCount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  commentsCount: number;

  @Column({
    type: DataType.ENUM('active', 'inactive', 'deleted'),
    defaultValue: 'active',
  })
  status: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  isDeleted?: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  isBusinessPost?: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deletedAt?: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  whatsappNumber?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  businessCategory: string;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => PostLike)
  likes: PostLike[];

  @HasMany(() => PostComment)
  comments: PostComment[];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  updatedAt: Date;
}
