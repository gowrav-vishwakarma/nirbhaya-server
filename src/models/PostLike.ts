import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './User';
import { CommunityPost } from './CommunityPost';

@Table({
  tableName: 'post_likes',
  timestamps: true,
})
export class PostLike extends Model<PostLike> {
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

  @ForeignKey(() => CommunityPost)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  postId: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => CommunityPost)
  post: CommunityPost;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
