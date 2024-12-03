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

@Table({
  tableName: 'communityPosts',
  timestamps: true,
})
export class CommunityPost extends Model<CommunityPost> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
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
    allowNull: false,
    defaultValue: { type: 'Point', coordinates: [0, 0] },
  })
  location: any;

  @Column({
    type: DataType.STRING,
  })
  badge?: string;

  @Column({
    type: DataType.TEXT,
    get() {
      const rawValue = this.getDataValue('tags');
      if (!rawValue) return [];
      try {
        return JSON.parse(rawValue);
      } catch {
        return [];
      }
    },
    set(value: string[]) {
      this.setDataValue('tags', JSON.stringify(value));
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
    defaultValue: 'medium',
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
