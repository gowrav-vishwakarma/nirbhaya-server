import {
  Column,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { News } from './News';

@Table
export class NewsTranslation extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => News)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  newsId: number;

  @Column({
    type: DataType.STRING(5),
    allowNull: false,
  })
  languageCode: string;

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

  @BelongsTo(() => News)
  news: News;
}
