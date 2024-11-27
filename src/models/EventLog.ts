import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'eventLog', timestamps: true })
export class EventLog extends Model<EventLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  userType: string; // e.g., Product, Order, User

  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number; // ID of the affected entity

  @Column({
    type: DataType.STRING,
  })
  eventType: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  description: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  tabName: string; // For convenience in reporting

  @Column({ type: DataType.STRING(45), allowNull: true })
  ipAddress: string; // IP address of the user

  @Column({ type: DataType.GEOMETRY('POINT'), allowNull: true })
  location: any; // Geolocation of the user

  @Column({ type: DataType.JSON, allowNull: true })
  additionalData: object; // Extra details (e.g., old and new values)

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  count: number; // Extra details (e.g., old and new values)

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  date: Date;

  @CreatedAt
  @Column({ type: DataType.DATE })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updatedAt: Date;
}
