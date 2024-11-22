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
    type: DataType.DATE,
  })
  registerVolunteers: Date;

  @Column({
    type: DataType.DATE,
  })
  sosAccepted: Date;

  @Column({
    type: DataType.DATE,
  })
  sosMovement: Date;

  @Column({
    type: DataType.DATE,
  })
  sosHelp: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt: Date;
}
