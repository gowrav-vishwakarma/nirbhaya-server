import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { User } from './User';

@Table
export class Incident extends Model<Incident> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column(DataType.STRING)
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.STRING)
  videoUrl: string;

  @Index
  @Column({
    type: DataType.GEOMETRY('POINT', 4326),
    allowNull: false,
  })
  location: { type: string; coordinates: number[] };

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  likes: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  shares: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  comments: number;

  @Index
  @Column(DataType.DATE)
  createdAt: Date;

  @Column(DataType.DATE)
  updatedAt: Date;

  @Column({
    type: DataType.ENUM('normal', 'youtube'),
    allowNull: false,
    defaultValue: 'normal',
  })
  videoSource: 'normal' | 'youtube';

  @Column({
    type: DataType.ENUM('Active', 'InActive'),
    allowNull: false,
    defaultValue: 'Active',
  })
  status: 'Active' | 'InActive';
}
