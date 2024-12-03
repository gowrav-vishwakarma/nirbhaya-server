import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './User';
import { PostComment } from './PostComment';

@Table({
  tableName: 'commentReplies',
  timestamps: true,
})
export class CommentReply extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => PostComment)
  @Column
  commentId: number;

  @Column
  content: string;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => PostComment)
  comment: PostComment;
}
