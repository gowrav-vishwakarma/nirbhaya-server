import {
  Column,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { User } from './User';

@Table({
  tableName: 'community_feeds',
  timestamps: true,
})
export class CommunityFeed extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  mediaUrls: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  locations: string[];

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
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'general',
  })
  category: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  tags: string[];

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  likesCount: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  commentsCount: number;
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  sharesCount: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isEmergency: boolean;

  @Column({
    type: DataType.ENUM('active', 'archived', 'reported'),
    allowNull: false,
    defaultValue: 'active',
  })
  status: 'active' | 'archived' | 'reported';

  @BelongsTo(() => User)
  user: User;
}
function Index(target: CommunityFeed, propertyKey: 'location'): void {
  throw new Error('Function not implemented.');
}
