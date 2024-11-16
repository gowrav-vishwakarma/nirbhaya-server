import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  Index,
  BelongsTo,
} from 'sequelize-typescript';

import { User } from './User';
import { Notification } from './Notification';
import { Responder } from './Responder';

@Table
export class SosEvent extends Model<SosEvent> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, { as: 'user', foreignKey: 'userId' })
  user: User;

  @HasMany(() => Notification, { as: 'notifications', foreignKey: 'eventId' })
  notifications: Notification[];

  @Index
  @Column({
    type: DataType.GEOMETRY('POINT', 4326),
    allowNull: false,
    get() {
      const point = this.getDataValue('location');
      if (!point) return null;

      if (point.x !== undefined && point.y !== undefined) {
        return {
          type: 'Point',
          coordinates: [point.x, point.y],
        };
      } else if (
        Array.isArray(point.coordinates) &&
        point.coordinates.length === 2
      ) {
        return {
          type: 'Point',
          coordinates: point.coordinates,
        };
      } else {
        console.error('Invalid point data:', point);
        return null;
      }
    },
    set(value: { type: string; coordinates: number[] } | null) {
      if (value && value.type === 'Point' && Array.isArray(value.coordinates)) {
        this.setDataValue('location', {
          type: 'Point',
          coordinates: value.coordinates,
        });
      } else {
        this.setDataValue('location', null);
      }
    },
  })
  location: { type: string; coordinates: number[] } | null;

  @Index
  @Column({
    type: DataType.ENUM('created', 'active', 'cancelled', 'resolved'),
    defaultValue: 'active',
  })
  status: 'created' | 'active' | 'cancelled' | 'resolved';

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  threat: string | null;

  @Index
  @Column(DataType.DATE)
  resolvedAt: Date;

  @HasMany(() => Responder)
  responders: Responder[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  contactsOnly: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  escalationLevel: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  informed: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  accepted: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  uploadId: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  presignedUrl: string | null;
}
