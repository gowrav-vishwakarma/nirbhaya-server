import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from './User';

@Table
export class EmergencyContact extends Model {
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

  @BelongsTo(() => User, 'userId')
  user: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  contactUserId: number;

  @BelongsTo(() => User, 'contactUserId')
  contactUser: User;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  contactName: string;

  @Column({
    type: DataType.STRING(15),
    allowNull: false,
  })
  contactPhone: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  relationship: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isAppUser: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  priority: number;
}
