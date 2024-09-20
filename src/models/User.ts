import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  Index,
  HasOne,
  ForeignKey,
  BelongsTo,
  Unique,
} from 'sequelize-typescript';
import { EmergencyContact } from './EmergencyContact';
import { UserLocation } from './UserLocation';
import { SosEvent } from './SosEvent';
import { CommunityApplications } from './CommunityApplications';

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

  @Index
  @Column(DataType.STRING(255))
  deviceId: string;

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

  @Column(DataType.BOOLEAN)
  hasJoinedCommunity: boolean;

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

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  startAudioVideoRecordOnSos: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  streamAudioVideoOnSos: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  broadcastAudioOnSos: boolean;

  @HasMany(() => EmergencyContact)
  emergencyContacts: EmergencyContact[];

  @HasMany(() => UserLocation)
  locations: UserLocation[];

  @HasMany(() => SosEvent)
  sosEvents: SosEvent[];

  @HasOne(() => CommunityApplications)
  communityApplication: CommunityApplications; // Add this line

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  fcmToken: string;

  @Index
  @Unique
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  referralId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  referUserId: number;

  @BelongsTo(() => User, 'referUserId')
  referredBy: User;

  @HasMany(() => User, 'referUserId')
  referrals: User[];
}
