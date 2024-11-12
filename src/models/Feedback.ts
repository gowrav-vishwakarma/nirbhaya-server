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
import { User } from './User'; // Assuming you have a User model
import { SosEvent } from './SosEvent'; // Assuming you have an Event model

@Table
export class Feedback extends Model<Feedback> {
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
  feedbackGiverId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  feedbackReceiverId: number;

  @ForeignKey(() => SosEvent)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  eventId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  feedbackText: string;

  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    validate: {
      min: 0,
      max: 5,
    },
  })
  rating: number;

  @Column({
    type: DataType.TIME,
    allowNull: true,
  })
  responseTime: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  updatedAt: Date;

  @Column({
    type: DataType.ENUM('Pending', 'Reviewed', 'Resolved'),
    allowNull: false,
    defaultValue: 'Pending',
  })
  status: 'Pending' | 'Reviewed' | 'Resolved';

  // Associations
  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => SosEvent)
  sosEvent: SosEvent;
}
