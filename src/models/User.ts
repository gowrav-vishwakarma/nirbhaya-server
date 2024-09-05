import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  Index,
} from 'sequelize-typescript';
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

  @Index // Add index to phoneNumber
  @Column({
    type: DataType.STRING(15),
    unique: true,
    allowNull: false,
  })
  phoneNumber: string;

  @Column({ allowNull: true })
  userType: string;

  @Column(DataType.STRING(100))
  name: string;

  @Column(DataType.STRING(100))
  email: string;

  @Column(DataType.DATE)
  lastLogin: Date;

  @Column(DataType.STRING(6))
  otp: string;

  @Column(DataType.TEXT)
  token: string;

  @Index
  @Column(DataType.STRING(100))
  profession: string;

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

  @Index
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  availableForCommunity: boolean; // Changed from liveSosEventChecking

  @Index
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  availableForPaidProfessionalService: boolean; // Added new field

  @HasMany(() => EmergencyContact)
  emergencyContacts: EmergencyContact[];

  @HasMany(() => UserLocation)
  locations: UserLocation[];

  @HasMany(() => SosEvent)
  sosEvents: SosEvent[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  fcmToken: string;
}
