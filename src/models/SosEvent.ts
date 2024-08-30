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
import { Notification } from './Notification';
import { Responder } from './Responder';

@Table
export class SosEvent extends Model<SosEvent> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.GEOMETRY('POINT', 4326),
    allowNull: false,
  })
  location: any; // Using 'any' as Sequelize doesn't have a specific type for GEOMETRY

  @Column({
    type: DataType.ENUM('active', 'cancelled', 'resolved'),
    defaultValue: 'active',
  })
  status: 'active' | 'cancelled' | 'resolved';

  @Column(DataType.DATE)
  resolvedAt: Date;

  @HasMany(() => Notification)
  notifications: Notification[];

  @HasMany(() => Responder)
  responders: Responder[];
}
