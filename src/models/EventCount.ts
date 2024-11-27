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
    defaultValue: 0,
  })
  registerUsers: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  appOpen: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  loginUsers: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sosEvents: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  news: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  registerVolunteers: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sosAccepted: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sosMovement: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  date: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sosHelp: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt: Date;
}
