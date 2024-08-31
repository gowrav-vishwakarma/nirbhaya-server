import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { EmergencyContact } from './EmergencyContact';
import { UserLocation } from './UserLocation';
import { SosEvent } from './SosEvent';

@Table
export class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(15),
    unique: true,
    allowNull: false,
  })
  phoneNumber: string;

  @Column({
    type: DataType.ENUM('child', 'volunteer'),
    allowNull: false,
  })
  userType: 'child' | 'volunteer';

  @Column(DataType.STRING(100))
  name: string;

  @Column(DataType.STRING(100))
  email: string;

  @Column(DataType.DATE)
  lastLogin: Date;

  @Column(DataType.STRING(6))
  otp: string;

  @Column(DataType.TEXT)
  token: String;

  // @Column(DataType.STRING(25))
  // status: string;

  @Column(DataType.DATE)
  otpCreatedAt: Date;

  @Column(DataType.DATE)
  otpExpiresAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isVerified: boolean;

  @Column(DataType.STRING(100))
  city: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  liveSosEventChecking: boolean;

  @HasMany(() => EmergencyContact)
  emergencyContacts: EmergencyContact[];

  @HasMany(() => UserLocation)
  locations: UserLocation[];

  @HasMany(() => SosEvent)
  sosEvents: SosEvent[];
}
