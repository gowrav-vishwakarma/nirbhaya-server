import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';

import { SosEvent } from './SosEvent';
import { User } from './User';
@Table
export class Responder extends Model<Responder> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => SosEvent)
  @Column(DataType.INTEGER)
  eventId: number;

  @BelongsTo(() => SosEvent)
  sosEvent: SosEvent;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.ENUM('en_route', 'arrived', 'completed'),
    defaultValue: 'en_route',
  })
  status: 'en_route' | 'arrived' | 'completed';

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  acceptedAt: Date;

  @Column(DataType.DATE)
  arrivedAt: Date;

  @Column(DataType.DATE)
  completedAt: Date;
}
