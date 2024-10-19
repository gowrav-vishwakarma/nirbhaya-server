import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  CreatedAt,
} from 'sequelize-typescript';
import { Incident } from './Incident'; // Assuming you have a Reel model
import { User } from './User'; // Assuming you have a User model

@Table({
  tableName: 'Comments', // Table name in the database
  timestamps: true, // No automatic createdAt/updatedAt fields
})
export class Comment extends Model<Comment> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Incident)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  incidentId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  comment_text: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  // Associations

  @BelongsTo(() => Incident)
  incident: Incident;

  @BelongsTo(() => User)
  user: User;
}
