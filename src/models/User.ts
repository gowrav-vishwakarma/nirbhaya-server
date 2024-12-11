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
} from 'sequelize-typescript';
import { EmergencyContact } from './EmergencyContact';
import { UserLocation } from './UserLocation';
import { SosEvent } from './SosEvent';
import { CommunityApplications } from './CommunityApplications';
import { Suggestion } from './Suggestion';
import { Feedback } from './Feedback';
import { UserInteraction } from './UserInteractions';

interface PlatformInfo {
  [key: string]: any;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum RoleType {
  USER = 'User',
  VOLUNTEER = 'Volunteer',
  AMBASSADOR = 'Ambassador',
  ADVISER = 'Adviser',
}

@Table({
  tableName: 'Users', // explicitly define table name
})
export class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index // Consider if this index is necessary
  @Column({
    type: DataType.STRING(15),
    // unique: true,
    allowNull: false,
  })
  phoneNumber: string;

  @Column({ allowNull: true })
  userType: string;

  @Column(DataType.STRING(100))
  name: string;

  @Column(DataType.STRING(100))
  email: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  dob: Date;

  @Column(DataType.STRING(100))
  city: string;

  @Column(DataType.STRING(100))
  state: string;

  @Column(DataType.DATE)
  lastLogin: Date;

  @Column(DataType.STRING(6))
  otp: string;

  @Column(DataType.STRING(6))
  pincode: string;

  @Index // Consider if this index is necessary
  @Column(DataType.STRING(255))
  deviceId: string;

  @Column(DataType.TEXT)
  token: string;

  @Index // Consider if this index is necessary
  @Column(DataType.STRING(100))
  profession: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    defaultValue: UserStatus.ACTIVE,
    allowNull: false,
  })
  status: UserStatus;

  @Column(DataType.DATE)
  otpCreatedAt: Date;

  @Column(DataType.DATE)
  otpExpiresAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isVerified: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(RoleType)),
    allowNull: false,
    defaultValue: RoleType.USER,
  })
  roleType: RoleType;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  canCreatePost: boolean;

  @Column(DataType.BOOLEAN)
  hasJoinedCommunity: boolean;

  @Index // Consider if this index is necessary
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  availableForCommunity: boolean; // Changed from liveSosEventChecking

  @Index // Consider if this index is necessary
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

  @HasMany(() => SosEvent, { as: 'sosEvents', foreignKey: 'userId' })
  sosEvents: SosEvent[];

  @HasOne(() => CommunityApplications)
  communityApplication: CommunityApplications; // Add this line

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  fcmToken: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isAmbassador: boolean;

  @Index // Consider if this index is necessary
  @Column({
    type: DataType.STRING,
    // unique: true,
  })
  referralId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  ambassadorReferralId: number;

  @BelongsTo(() => User, 'ambassadorReferralId')
  ambassadorReferrer: User;

  @Column({
    type: DataType.STRING,
  })
  instagramId: string;

  @Column({
    type: DataType.STRING,
  })
  twitterId: string;

  @Column({
    type: DataType.STRING,
  })
  facebookId: string;

  @Column({
    type: DataType.STRING,
  })
  linkedinId: string;

  @Column({
    type: DataType.STRING,
  })
  youtubeId: string;

  @Column({
    type: DataType.STRING,
  })
  telegramId: string;

  @Column({
    type: DataType.DATE,
  })
  ambassadorTimestamp: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 100,
    allowNull: false,
  })
  dailyLikeLimit: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 100,
    allowNull: false,
  })
  dailyCommentLimit: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 10,
    allowNull: false,
  })
  dailyPostLimit: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  referUserId: number;

  @BelongsTo(() => User, 'referUserId')
  referrer: User;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  point: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  businessName: string;

  @Column({
    type: DataType.STRING(15),
    allowNull: true,
  })
  whatsappNumber: string;

  @Column({
    type: DataType.STRING(15),
    allowNull: true,
  })
  deviceName: string;

  @BelongsTo(() => User, 'referUserId')
  referredBy: User;

  @HasMany(() => User, 'referUserId')
  referrals: User[];

  @HasMany(() => Suggestion)
  suggestions: Suggestion[];

  @HasMany(() => Feedback, {
    foreignKey: 'feedbackGiverId',
    as: 'givenFeedbacks',
  })
  givenFeedbacks: Feedback[];

  @HasMany(() => Feedback, {
    foreignKey: 'feedbackReceiverId',
    as: 'receivedFeedbacks',
  })
  receivedFeedbacks: Feedback[];

  @HasMany(() => UserInteraction)
  userInteractions: UserInteraction[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: 'Stores device/browser platform information',
  })
  platform: PlatformInfo;
}
