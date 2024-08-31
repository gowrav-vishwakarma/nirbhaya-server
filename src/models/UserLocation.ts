import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';

import { User } from './User';
@Table
export class UserLocation extends Model<UserLocation> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @Column(DataType.STRING)
  name: string;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.GEOMETRY('POINT'),
    allowNull: false,
  })
  location: any; // Using 'any' as Sequelize doesn't have a specific type for GEOMETRY

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  timestamp: Date;
}
