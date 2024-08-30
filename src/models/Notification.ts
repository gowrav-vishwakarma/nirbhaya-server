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
export class Notification extends Model<Notification> {
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
  recipientId: number;

  @BelongsTo(() => User)
  recipient: User;

  @Column({
    type: DataType.ENUM('volunteer', 'emergency_contact'),
    allowNull: false,
  })
  recipientType: 'volunteer' | 'emergency_contact';

  @Column({
    type: DataType.ENUM('sent', 'received', 'accepted', 'ignored'),
    defaultValue: 'sent',
  })
  status: 'sent' | 'received' | 'accepted' | 'ignored';
}
