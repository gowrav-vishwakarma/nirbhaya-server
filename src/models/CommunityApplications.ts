import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from './User';

@Table
export class CommunityApplications extends Model<CommunityApplications> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column(DataType.TEXT)
  inspiration: string;

  @Column(DataType.TEXT)
  contribution: string;

  @Column(DataType.TEXT)
  skills: string;

  @Column(DataType.STRING)
  time: string;
}
