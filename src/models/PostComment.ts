import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  HasMany,
  DataType,
} from 'sequelize-typescript';
import { User } from './User';
import { CommunityPost } from './CommunityPost';
import { CommentLike } from './CommentLike';
import { CommentReply } from './CommentReply';

@Table({
  tableName: 'postComments',
  timestamps: true,
})
export class PostComment extends Model<PostComment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @ForeignKey(() => CommunityPost)
  @Column(DataType.INTEGER)
  postId: number;

  @Column(DataType.TEXT)
  content: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  likesCount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  repliesCount: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => CommunityPost)
  post: CommunityPost;

  @HasMany(() => CommentLike)
  likes: CommentLike[];

  @HasMany(() => CommentReply)
  replies: CommentReply[];
}
