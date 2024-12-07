import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  Index,
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

  @Index // Add index to userId
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @Column(DataType.STRING)
  name: string;

  @BelongsTo(() => User)
  user: User;

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

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  isBusinessLocation?: boolean;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  timestamp: Date;
}
