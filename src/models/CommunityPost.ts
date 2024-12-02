import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './User'; // Assuming there's a `User` model for the `user_id` foreign key.

@Table({
  tableName: 'communityPosts',
  timestamps: true, // Enables `createdAt` and `updatedAt`.
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
  userId!: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

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
    type: DataType.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  })
  status: 'active' | 'inactive';

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
  likesCount: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  commentsCount: number;
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  sharesCount: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  updatedAt!: Date;

  @Column({
    type: DataType.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
  })
  priority!: 'low' | 'medium' | 'high';

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  sequence!: number;

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
  postType!: 'post' | 'testimonial' | 'other';
}
