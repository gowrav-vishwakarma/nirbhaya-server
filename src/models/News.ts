import {
  Column,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import { User } from './User';
import { NewsTranslation } from './NewsTranslation';

@Table
export class News extends Model {
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
    type: DataType.TEXT,
    get() {
      const rawValue = this.getDataValue('mediaUrls');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value: string[]) {
      this.setDataValue('mediaUrls', JSON.stringify(value));
    },
  })
  mediaUrls: string[];

  @Column({
    type: DataType.TEXT,
    get() {
      const rawValue = this.getDataValue('locations');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value: string[]) {
      this.setDataValue('locations', JSON.stringify(value));
    },
  })
  locations: string[];

  // @Column({
  //   type: DataType.GEOMETRY('POINT', 4326),
  //   allowNull: false,
  //   get() {
  //     const point = this.getDataValue('location');
  //     if (!point) return null;

  //     if (point.x !== undefined && point.y !== undefined) {
  //       return {
  //         type: 'Point',
  //         coordinates: [point.x, point.y],
  //       };
  //     } else if (
  //       Array.isArray(point.coordinates) &&
  //       point.coordinates.length === 2
  //     ) {
  //       return {
  //         type: 'Point',
  //         coordinates: point.coordinates,
  //       };
  //     } else {
  //       console.error('Invalid point data:', point);
  //       return null;
  //     }
  //   },
  //   set(value: { type: string; coordinates: number[] } | null) {
  //     if (value && value.type === 'Point' && Array.isArray(value.coordinates)) {
  //       this.setDataValue('location', {
  //         type: 'Point',
  //         coordinates: value.coordinates,
  //       });
  //     } else {
  //       this.setDataValue('location', null);
  //     }
  //   },
  // })
  // location: { type: string; coordinates: number[] } | null;

  @Column({
    type: DataType.TEXT,
    get() {
      const rawValue = this.getDataValue('categories');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value: string[]) {
      this.setDataValue('categories', JSON.stringify(value));
    },
  })
  categories: string[];

  @Column({
    type: DataType.TEXT,
    get() {
      const rawValue = this.getDataValue('tags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value: string[]) {
      this.setDataValue('tags', JSON.stringify(value));
    },
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

  @Column({
    type: DataType.STRING(5),
    allowNull: false,
    defaultValue: 'en',
  })
  defaultLanguage: string;

  @HasMany(() => NewsTranslation)
  translations: NewsTranslation[];

  @BelongsTo(() => User)
  user: User;
}
