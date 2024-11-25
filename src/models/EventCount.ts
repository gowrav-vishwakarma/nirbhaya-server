import {
  Table,
  Model,
  DataType,
  Column,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'EventCount',
  timestamps: true,
})
export class EventCount extends Model<EventCount> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
  })
  registerUsers: number;

  @Column({
    type: DataType.INTEGER,
  })
  loginUsers: number;

  @Column({
    type: DataType.INTEGER,
  })
  sosEvents: number;

  @Column({
    type: DataType.INTEGER,
  })
  news: number;

  @Column({
    type: DataType.INTEGER,
  })
  registerVolunteers: number;

  @Column({
    type: DataType.INTEGER,
  })
  sosAccepted: number;

  @Column({
    type: DataType.INTEGER,
  })
  sosMovement: number;

  @Column({
    type: DataType.INTEGER,
  })
  sosHelp: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt: Date;
}
