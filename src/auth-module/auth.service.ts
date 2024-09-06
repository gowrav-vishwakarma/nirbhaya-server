import { JwtService } from '@nestjs/jwt';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { UserLocation } from 'src/models/UserLocation';
import { SosEvent } from 'src/models/SosEvent';
import { Notification } from 'src/models/Notification'; // Add this import

import { ValidationException } from '../qnatk/src/Exceptions/ValidationException';
import { UserJWT } from 'src/dto/user-jwt.dto';
import { SosService } from './sos/sos.service';
import { UserProfileUpdateDto } from './dto/user-profile-update.dto';
import { Op, Sequelize } from 'sequelize';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly sosService: SosService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,
    @InjectModel(SosEvent)
    private readonly sosEventModel: typeof SosEvent,
    @InjectModel(Notification) // Add this line
    private readonly notificationModel: typeof Notification, // Add this line
  ) {}

  async signUp(signUpDto: any): Promise<any> {
    return signUpDto;
  }

  async logIn(logInDto, t?: Transaction): Promise<any> {
    const { mobileNumber, otp } = logInDto;

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
      attributes: ['id', 'name', 'location', 'timestamp'],
    });

    const userDetails = {
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      city: user.city,
      availableForCommunity: user.availableForCommunity,
      emergencyContacts: user.emergencyContacts,
      locations: userLocations.map((location) => ({
        id: location.id,
        name: location.name,
        location: location.location,
        timestamp: location.timestamp,
      })),
    };

    const tokenPayload: UserJWT = {
      id: user.id,
      phoneNumber: user.phoneNumber,
    };

    const token = this.jwtService.sign(tokenPayload);

    await this.userModel.update(
      { token: token, isVerified: true, lastLogin: new Date() },
      {
        where: {
          id: user.id,
        },
        transaction: t,
      },
    );

    return {
      ...userDetails,
      token,
    };
  }

  async userProfileUpdate(
    data: UserProfileUpdateDto,
    loggedInUser: UserJWT,
  ): Promise<any> {
    try {
      console.log('update data...', data);

      const user = await this.userModel.findOne({
        where: {
          id: loggedInUser.id,
        },
        include: [
          {
            model: EmergencyContact,
            as: 'emergencyContacts',
          },
        ],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update only the fields that are provided in the data object
      if (data.name !== undefined) user.name = data.name;
      if (data.city !== undefined) user.city = data.city;
      if (data.availableForCommunity !== undefined)
        user.availableForCommunity = data.availableForCommunity;
      if (data.availableForPaidProfessionalService !== undefined)
        user.availableForPaidProfessionalService =
          data.availableForPaidProfessionalService;
      if (data.userType !== undefined) user.userType = data.userType;
      if (data.profession !== undefined) user.profession = data.profession;

      await user.save();

      // Handle emergency contacts if provided
      if (data.emergencyContacts) {
        await this.userEmergencyContactAdd(user.id, data.emergencyContacts);
      }

      // Handle locations if provided
      if (data.locations) {
        await this.userLocationAdd(user.id, data.locations);
      }

      // Fetch the updated user data
      const updatedUser = await this.userModel.findOne({
        where: { id: loggedInUser.id },
        include: [
          {
            model: EmergencyContact,
            as: 'emergencyContacts',
          },
        ],
      });

      // Fetch user locations separately
      const userLocations = await this.userLocationModel.findAll({
        where: { userId: loggedInUser.id },
        attributes: ['id', 'name', 'location', 'timestamp'],
      });

      // Format the user data before returning
      const formattedUser = {
        ...updatedUser.toJSON(),
        locations: userLocations.map((location) => ({
          id: location.id,
          name: location.name,
          location: location.location,
          timestamp: location.timestamp,
        })),
      };

      return {
        success: true,
        message: 'User profile updated successfully',
        user: formattedUser,
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new BadRequestException(error);
    }
  }

  async userEmergencyContactAdd(userId: number, contacts: any[]): Promise<any> {
    // Delete only the contacts that are not in the new list
    const existingContacts = await this.emergencyContactModel.findAll({
      where: { userId: userId },
    });

    const existingPhones = existingContacts.map(
      (contact) => contact.contactPhone,
    );
    const newPhones = contacts.map((contact) => contact.contactPhone);

    const phonesToDelete = existingPhones.filter(
      (phone) => !newPhones.includes(phone),
    );

    await this.emergencyContactModel.destroy({
      where: {
        userId: userId,
        contactPhone: phonesToDelete,
      },
    });

    // Update or create new contacts
    for (const contactData of contacts) {
      const user = await this.userModel.findOne({
        where: {
          phoneNumber: contactData.contactPhone,
        },
      });

      if (!user) {
        throw new ValidationException({
          [contactData.contactPhone]: [
            `Contact ${contactData.contactPhone} is not on the app`,
          ],
        });
      }

      const [contact, created] = await this.emergencyContactModel.findOrCreate({
        where: {
          userId: userId,
          contactPhone: contactData.contactPhone,
        },
        defaults: {
          contactName: contactData.contactName,
          contactPhone: contactData.contactPhone,
          isAppUser: true,
          contactUserId: user.id, // Add this line to save the contact's user ID
        },
      });

      if (!created) {
        // If the contact already exists, update its details
        await contact.update({
          contactName: contactData.contactName,
          isAppUser: true,
          contactUserId: user.id, // Update the contact's user ID
        });
      }
    }
    return { message: 'Emergency contacts updated successfully' };
  }

  async userLocationAdd(userId: number, locations: any[]): Promise<any> {
    // Get all existing locations for the user
    const existingLocations = await this.userLocationModel.findAll({
      where: { userId: userId },
    });

    const existingNames = existingLocations.map((location) => location.name);
    const newNames = locations.map((location) => location.name);

    // Find names to delete (existing names not in the new list)
    const namesToDelete = existingNames.filter(
      (name) => !newNames.includes(name),
    );

    // Delete locations that are not in the new list
    await this.userLocationModel.destroy({
      where: {
        userId: userId,
        name: namesToDelete,
      },
    });

    // Update or create locations
    for (const locationData of locations) {
      const location = {
        type: 'Point',
        coordinates: [
          locationData.location.coordinates[0],
          locationData.location.coordinates[1],
        ],
      };

      // Try to find an existing location with the same name
      const existingLocation = await this.userLocationModel.findOne({
        where: {
          userId: userId,
          name: locationData.name,
        },
      });

      if (existingLocation) {
        // Update existing location
        await existingLocation.update({
          location: location,
        });
      } else {
        // Create new location
        await this.userLocationModel.create({
          userId: userId,
          name: locationData.name,
          location: location,
        });
      }
    }

    return { message: 'User locations updated successfully' };
  }

  async sosUpdate(data: any, user: UserJWT): Promise<any> {
    try {
      console.log('data...........', data);
      let sosEvent = await this.sosEventModel.findOne({
        where: { userId: user.id, status: 'active' },
      });

      const location = data.location
        ? {
            type: 'Point',
            coordinates: [data.location.longitude, data.location.latitude],
          }
        : {
            type: 'Point',
            coordinates: [0, 0],
          };

      if (sosEvent) {
        const formatedSosData = {
          location: location || sosEvent.location,
          threat: data.threat || sosEvent.threat,
          status: data.status || sosEvent.status,
        };

        await sosEvent.update(formatedSosData);
        Object.assign(sosEvent, formatedSosData);
      } else {
        sosEvent = await this.sosEventModel.create({
          location: location ? location : null,
          userId: user.id,
          status: 'active',
          threat: data.threat,
          informed: 0,
          accepted: 0,
          escalationLevel: 0,
        });
      }

      if (!sosEvent.location || sosEvent.location.coordinates[0] == 0) {
        return;
      }

      // Call sosService.handleSos with the new or updated SOS event
      return await this.sosService.handleSos(sosEvent);
    } catch (error) {
      console.error('Error in sosLocationCrud:', error);
      throw new Error('Failed to process SOS location');
    }
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

  async send_otp(mobileNumber: string) {
    if (!mobileNumber) {
      throw new ValidationException({
        mobile: ['mobile, userType and countryCode required'],
      });
    }
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
      ],
      where: {
        phoneNumber: mobileNumber,
      },
      raw: true,
    });
    console.log('existingUser...........', existingUser);

    const newOtp = this.generateOtp(4);

    if (existingUser) {
      await this.userModel.update(
        { otp: newOtp },
        {
          where: {
            id: existingUser.id,
          },
        },
      );
    } else {
      existingUser = await this.userModel.create({
        otp: newOtp,
        phoneNumber: mobileNumber,
      });
    }

    return { otpSent: true };
  }

  generateOtp(characters: number): string {
    if (process.env.NODE_ENVIRONMENT == 'staging') {
      return '1234';
    }
    return Math.floor(
      10 ** (characters - 1) + Math.random() * (9 * 10 ** (characters - 1)),
    ).toString();
  }

  async updateFcmToken(userId: number, fcmToken: string): Promise<void> {
    await this.userModel.update({ fcmToken }, { where: { id: userId } });
  }

  async getNotifications(userId: number): Promise<any[]> {
    try {
      const notifications = await this.notificationModel.findAll({
        where: { recipientId: userId },
        include: [
          {
            model: this.sosEventModel,
            attributes: ['id', 'location', 'status', 'threat'],
            where: { status: 'active' }, // Only include active SOS events
          },
        ],
        order: [['createdAt', 'DESC']],
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
      });
      return count;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw new HttpException(
        'Failed to fetch unread notification count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validatePhone(phoneNumber: string): Promise<{ isValid: boolean }> {
    try {
      const user = await this.userModel.findOne({
        where: { phoneNumber },
      });

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
  async getVolunteersNearby(
    latitude: number,
    longitude: number,
    range: number,
  ): Promise<any[]> {
    try {
      const volunteers = await this.userLocationModel.findAll({
        attributes: ['id', 'location'],
        include: [
          {
            model: this.userModel,
            attributes: ['id', 'profession'],
            where: {
              availableForCommunity: true,
            },
          },
        ],
        where: Sequelize.where(
          Sequelize.fn(
            'ST_Distance_Sphere',
            Sequelize.col('location'),
            Sequelize.fn('ST_GeomFromText', `POINT(${longitude} ${latitude})`),
          ),
          {
            [Op.lte]: range,
          },
        ),
      });

      return volunteers.map((volunteer) => ({
        id: volunteer.user.id,
        profession: volunteer.user.profession,
        location: volunteer.location,
      }));
    } catch (error) {
      console.error('Error fetching nearby volunteers:', error);
      throw new HttpException(
        'Failed to fetch nearby volunteers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logout(userId: number): Promise<any> {
    await this.userModel.update(
      { token: null, fcmToken: null },
      { where: { id: userId } },
    );
    return { message: 'User logged out successfully' };
  }
}
