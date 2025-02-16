import { JwtService } from '@nestjs/jwt';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserStatus } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { UserLocation } from 'src/models/UserLocation';
import { SosEvent } from 'src/models/SosEvent';
import { Notification } from 'src/models/Notification'; // Add this import
import { CommunityApplications } from 'src/models/CommunityApplications';
import { Suggestion } from 'src/models/Suggestion';
import { SuggestionDto } from '../suggestion/suggestion.dto';

import { ValidationException } from '../qnatk/src/Exceptions/ValidationException';
import { UserJWT } from 'src/dto/user-jwt.dto';
import { SmsService } from 'src/sms/sms.service';
import { ConfigService } from '@nestjs/config';
import { GlobalService } from 'src/global/global.service';
import { CommunityPost } from '../models/CommunityPost';
import { TempOtps } from 'src/models/TempOtps';
import { FirebaseService } from 'src/sos/firebase.service';

@Injectable()
export class AuthService {
  private baseCounter = 100000000;

  constructor(
    private jwtService: JwtService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,
    @InjectModel(SosEvent)
    private readonly sosEventModel: typeof SosEvent,
    @InjectModel(Notification) // Add this line
    private readonly notificationModel: typeof Notification, // Add this line
    @InjectModel(CommunityApplications)
    private readonly communityApplicationsModel: typeof CommunityApplications,
    @InjectModel(Suggestion)
    private readonly suggestionModel: typeof Suggestion,
    @InjectModel(TempOtps)
    private readonly tempOtpModel: typeof TempOtps,
    @InjectModel(CommunityPost)
    private readonly communityPostModel: typeof CommunityPost,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
    private readonly gobalService: GlobalService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async signUp(signUpDto: any): Promise<any> {
    return signUpDto;
  }

  // New common method to format user response
  private formatUserResponse(
    user: any,
    token: string,
    userLocations: any[],
  ): any {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      city: user.city,
      state: user.state,
      dob: user.dob,
      profession: user.profession,
      pincode: user.pincode,
      availableForCommunity: user.availableForCommunity,
      availableForPaidProfessionalService:
        user.availableForPaidProfessionalService,
      hasJoinedCommunity: user.hasJoinedCommunity,
      emergencyContacts: user.emergencyContacts,
      autoNotifyNearbyDefault: user.autoNotifyNearbyDefault,
      locations: userLocations.map((location) => ({
        id: location.id,
        name: location.name,
        location: location.location,
        timestamp: location.timestamp,
        isBusinessLocation: location.isBusinessLocation,
      })),
      startAudioVideoRecordOnSos: user.startAudioVideoRecordOnSos,
      streamAudioVideoOnSos: user.streamAudioVideoOnSos,
      broadcastAudioOnSos: user.broadcastAudioOnSos,
      token, // Include the token in the response
      referralId: user.referralId, // Include the referralId in the response
      referredBy: user.referredBy ? user.referredBy.referralId : null,
      isAmbassador: user.isAmbassador,
      canCreatePost: user.canCreatePost,
      businessName: user.businessName,
      whatsappNumber: user.whatsappNumber,
      profileImage: user.profileImage,
      defaultApp: user.defaultApp,
      status: user.status,
      deletionRequestedAt: user.deletionRequestedAt,
      deletionReason: user.deletionReason,
    };
  }

  async logIn(logInDto, t?: Transaction): Promise<any> {
    const { mobileNumber, otp, deviceId } = logInDto; // Include deviceId

    console.log('login details', mobileNumber, otp);
    const userCond = {
      phoneNumber: mobileNumber,
      otp: otp,
    };

    const user = await this.userModel.findOne({
      attributes: [
        'id',
        'phoneNumber',
        'userType',
        'name',
        'email',
        'token',
        'otpExpiresAt',
        'isVerified',
        'availableForCommunity',
        'availableForPaidProfessionalService',
        'hasJoinedCommunity',
        'startAudioVideoRecordOnSos',
        'autoNotifyNearbyDefault',
        'streamAudioVideoOnSos',
        'broadcastAudioOnSos',
        'deviceId',
        'referralId',
        'city',
        'state',
        'pincode',
        'dob',
        'profession',
        'isAmbassador',
        'canCreatePost',
        'businessName',
        'whatsappNumber',
        'profileImage',
        'defaultApp',
        'status',
        'deletionRequestedAt',
        'deletionReason',
      ],
      include: [
        {
          model: EmergencyContact,
          required: false,
          as: 'emergencyContacts',
          attributes: [
            'contactName',
            'contactPhone',
            'relationship',
            'isAppUser',
            'priority',
          ],
        },
        {
          model: User,
          required: false,
          as: 'referredBy',
          attributes: ['referralId'],
        },
      ],
      where: userCond,
      transaction: t,
    });

    if (!user) {
      throw new HttpException('Unauthorized access.', HttpStatus.UNAUTHORIZED);
    }

    delete user.otp;

    // Fetch user locations separately
    const userLocations = await this.userLocationModel.findAll({
      where: { userId: user.id },
      attributes: ['id', 'name', 'location', 'isBusinessLocation', 'timestamp'],
    });

    const tokenPayload: UserJWT = {
      id: user.id,
      sub: user.id,
      phoneNumber: user.phoneNumber,
    };

    const token = this.jwtService.sign(tokenPayload, {
      expiresIn: '360d',
    });

    // remove fcmToken and tokend from User for this deviceId
    await this.userModel.update(
      { fcmToken: null, token: null, deviceId: null },
      {
        where: {
          deviceId: deviceId,
        },
      },
    );

    await this.userModel.update(
      { token: token, isVerified: true, lastLogin: new Date(), deviceId }, // Update deviceId
      {
        where: {
          id: user.id,
        },
        transaction: t,
      },
    );
    const userDetails = this.formatUserResponse(user, token, userLocations);

    return userDetails;
  }

  async checkAuth(tokenData: string): Promise<any> {
    const token = this.extractTokenFromHeader(tokenData);
    if (!token) {
      console.log('Could not find token');
      return false;
    }
    try {
      const decodedData = await this.jwtService.verifyAsync(token);
      return {
        user: decodedData,
      };
    } catch (error) {
      console.log('error', error);
      return false;
    }
  }

  private extractTokenFromHeader(tokenData: string): string | undefined {
    const [type, token] = tokenData?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async send_otp(mobileNumber: string, platform: object) {
    if (!mobileNumber) {
      throw new ValidationException({
        mobile: ['mobile, userType and countryCode required'],
      });
    }
    let eventType;

    let existingUser = await this.userModel.findOne({
      attributes: [
        'id',
        'phoneNumber',
        'userType',
        'name',
        'email',
        'otp',
        'token',
        'otpExpiresAt',
        'isVerified',
        'status',
      ],
      where: {
        phoneNumber: mobileNumber,
      },
      raw: true,
    });

    let newOtp: string;

    if (mobileNumber === '0000111122') {
      newOtp = '6786'; // Fixed OTP for the special number
    } else {
      newOtp =
        this.configService.get<string>('IS_MENUAL_OTP_SEND_ENABLED') === 'true'
          ? '6752' // Fixed OTP when manual mode is enabled
          : this.generateOtp(4); // Random OTP when manual mode is disabled
    }

    if (existingUser) {
      await this.userModel.update(
        { otp: newOtp, platform },
        {
          where: {
            id: existingUser.id,
          },
        },
      );
      eventType = 'loginUsers';
    } else {
      existingUser = await this.userModel.create({
        otp: newOtp,
        phoneNumber: mobileNumber,
        platform,
      });

      const uniqueId = this.generateUniqueId(existingUser.id);
      await this.userModel.update(
        { referralId: uniqueId },
        {
          where: {
            id: existingUser.id,
          },
        },
      );
      eventType = 'registerUsers';
    }

    // Store OTP in TempOtp table if manual mode is enabled
    if (
      this.configService.get<string>('IS_MENUAL_OTP_SEND_ENABLED') === 'true'
    ) {
      await this.tempOtpModel.create({
        mobile: mobileNumber,
        isSend: false,
        otp: newOtp,
      });
      const otpSenderId = this.configService
        .get<string>('OTP_SENDER_ID')
        .split(',');
      const users = await this.userModel.findAll({
        attributes: ['id', 'name', 'fcmToken'],
        where: { id: otpSenderId },
        raw: true,
      });
      for (const user of users) {
        if (user) {
          await this.firebaseService.sendPushNotification(
            user.fcmToken,
            `${user.name} Please send Otp to this number #${mobileNumber}`,
            `OTP is ${newOtp}`,
            `${newOtp}`,
            'send Otp',
            {},
          );
        }
      }
      console.log('otpSenderId', otpSenderId);
    } else if (mobileNumber !== '0000111122') {
      // Send SMS only if manual mode is disabled and not a test number
      await this.smsService.sendMessage(
        mobileNumber,
        `Welcome to SOSBharat! ${newOtp} is your OTP to join our safety-first community. Together we're stronger! By- Xavoc Technocrats Pvt. Ltd.`,
        '1407173149479902847',
      );
    }

    this.gobalService.updateEventCount(eventType, existingUser.id);
    return { otpSent: true };
  }

  generateOtp(characters: number): string {
    const sendSms = this.configService.get<'true' | 'false'>(
      'SEND_SMS',
      'false',
    );

    if (sendSms !== 'true') {
      return '1234';
    }

    return Math.floor(
      10 ** (characters - 1) + Math.random() * (9 * 10 ** (characters - 1)),
    ).toString();
  }

  private generateUniqueId(userId: number): string {
    const uniqueNumber = this.baseCounter + userId;
    return uniqueNumber.toString(36);
  }

  async updateFcmToken(userId: number, fcmToken: string): Promise<void> {
    await this.userModel.update({ fcmToken }, { where: { id: userId } });
  }

  async getNotifications(userId: number): Promise<any[]> {
    try {
      const notifications = await this.notificationModel.findAll({
        where: { recipientId: userId, status: ['sent', 'accepted'] },
        include: [
          {
            model: this.sosEventModel,
            attributes: ['id', 'location', 'status', 'threat', 'contactsOnly'],
            where: { status: 'active' }, // Only include active SOS events
          },
        ],
        order: [['createdAt', 'DESC']],
        group: ['eventId'],
        limit: 50,
      });

      return notifications.map((notification) => {
        const plainNotification = notification.get({ plain: true });
        if (plainNotification.sosEvent && plainNotification.sosEvent.location) {
          plainNotification.sosEvent.location = {
            type: 'Point',
            coordinates: plainNotification.sosEvent.location.coordinates,
          };
        }
        return plainNotification;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new HttpException(
        'Failed to fetch notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async acceptNotification(
    notificationId: number,
    userId: number,
  ): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      where: { id: notificationId, recipientId: userId, status: 'sent' },
      include: [{ model: this.sosEventModel }],
    });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found or cannot be accepted',
      );
    }

    notification.status = 'accepted';
    await notification.save();

    // Update the associated SOS event
    if (notification.sosEvent) {
      notification.sosEvent.accepted += 1;
      await notification.sosEvent.save();
    }

    return notification;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const count = await this.notificationModel.count({
        where: {
          recipientId: userId,
          status: 'sent',
        },
        include: [
          {
            model: this.sosEventModel,
            where: { status: 'active' }, // Only count notifications for active SOS events
            required: true,
          },
        ],
        group: ['eventId'],
      });
      return count.length;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw new HttpException(
        'Failed to fetch unread notification count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validatePhone(
    phoneNumber: string,
    createNew: boolean = false,
    name: string = '',
  ): Promise<{ isValid: boolean; IsCreated?: boolean }> {
    try {
      const user = await this.userModel.findOne({
        where: { phoneNumber },
      });

      if (!user && createNew) {
        // Create a new user if not found
        const IsCreatedByEmg = true;
        await this.userModel.create({
          phoneNumber,
          name,
          IsCreatedByEmg,
          // Add other default values as necessary
        });
        return { isValid: true, IsCreated: true }; // Return true as the user is created
      }

      return { isValid: !!user };
    } catch (error) {
      console.error('Error validating phone number:', error);
      throw new HttpException(
        'Error validating phone number',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Add this new method

  async logout(userId: number): Promise<any> {
    await this.userModel.update(
      { token: null, fcmToken: null, deviceId: null },
      { where: { id: userId } },
    );
    return { message: 'User logged out successfully' };
  }

  async applyToCommunity(data: any, userId: number): Promise<any> {
    const application = await this.communityApplicationsModel.create({
      userId,
      inspiration: data.inspiration,
      contribution: data.contribution,
      skills: data.skills,
      time: data.time,
    });
    await this.userModel.update(
      { hasJoinedCommunity: true },
      { where: { id: userId } },
    );
    return application;
  }

  async discardNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    await this.notificationModel.update(
      { status: 'discarded' },
      { where: { id: notificationId, recipientId: userId } },
    );
  }

  async findSharedPost(params: any) {
    const { status, offset = 0, limit = 5, postId } = params;
    const posts = await this.communityPostModel.findAll({
      where: {
        status: status || 'active',
        isDeleted: false,
        id: postId,
      },
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    return posts;
  }
}
