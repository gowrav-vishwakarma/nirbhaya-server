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
  tableName: 'commentLikes',
  timestamps: true,
})
export class CommentLike extends Model {
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

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => PostComment)
  comment: PostComment;
}
