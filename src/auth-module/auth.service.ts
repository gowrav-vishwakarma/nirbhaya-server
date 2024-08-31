import { JwtService } from '@nestjs/jwt';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
import { UserLocation } from 'src/models/UserLocation';
import { SosEvent } from 'src/models/SosEvent';

import { ValidationException } from '../qnatk/src/Exceptions/ValidationException';
import { UserJWT } from 'src/dto/user-jwt.dto';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
    @InjectModel(UserLocation)
    private readonly userLocationModel: typeof UserLocation,
    @InjectModel(SosEvent)
    private readonly sosEventModel: typeof SosEvent,
  ) {}

  async signUp(signUpDto: any): Promise<any> {
    return signUpDto;
  }

  async logIn(logInDto, t?: Transaction): Promise<any> {
    const { mobileNumber, otp } = logInDto;

    console.log('login details', mobileNumber, otp);
    let userCond: any = {
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
        'liveSosEventChecking',
      ],
      include: [
        {
          model: EmergencyContact,
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
          model: UserLocation,
          as: 'locations',
          attributes: ['name', 'location'],
        },
      ],
      where: userCond,
      transaction: t,
    });

    if (!user) {
      throw new HttpException('Unauthorized access.', HttpStatus.UNAUTHORIZED);
    }

    delete user.otp;

    const userDetails = {
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      city: user.city,
      liveSosEventChecking: user.liveSosEventChecking,
      emergencyContacts: user.emergencyContacts,
      locations: user.locations.map((location) => {
        return {
          name: location.name,
          location: {
            type: 'Point',
            coordinates: [location.location.x, location.location.y],
          },
        };
      }),
    };

    const tokenPayload: UserJWT = {
      id: user.id,
      phoneNumber: user.phoneNumber,
    };

    const token = this.jwtService.sign(tokenPayload);

    await this.userModel.update(
      { token: token },
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

  async userProfileUpdate(data: any): Promise<any> {
    try {
      console.log('update data...', data);

      const user = await this.userModel.findOne({
        where: {
          phoneNumber: data.phoneNumber,
        },
      });

      user.name = data.name;
      user.city = data.city;
      user.liveSosEventChecking = data.liveSosEventChecking;

      user.save();

      // Handle emergency contacts if provided
      await this.userEmergencyContactAdd(user.id, data.emergencyContacts);

      // Handle notification locations if provided
      if (data.locations && data.locations.length > 0) {
        await this.userLocationAdd(user.id, data.locations);
      }

      return { success: true, message: 'User profile updated successfully' };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new BadRequestException(error);
    }
  }

  async userEmergencyContactAdd(userId: number, contacts: any[]): Promise<any> {
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
        },
      });
    }
    await this.emergencyContactModel.destroy({
      where: {
        userId: userId,
        contactPhone: {
          [Op.notIn]: contacts.map((contact) => contact.contactPhone),
        },
      },
    });
    return { message: 'Emergency contacts updated successfully' };
  }

  async userLocationAdd(userId: number, locations: any[]): Promise<any> {
    await this.userLocationModel.destroy({
      where: {
        userId: userId,
      },
    });
    for (const locationData of locations) {
      const location = {
        type: 'Point',
        coordinates: [
          locationData.location.coordinates[0],
          locationData.location.coordinates[1],
        ],
      };
      await this.userLocationModel.create({
        userId: userId,
        name: locationData.name,
        location: location,
      });
    }

    return { message: 'User locations updated successfully' };
  }

  async sosLocationCrud(data: any, user: UserJWT): Promise<any> {
    try {
      console.log('data...........', data);
      const sosUserData = await this.sosEventModel.findOne({
        where: { userId: user.id },
        raw: true,
      });

      const location = {
        type: 'Point',
        coordinates: [data.location?.longitude, data.location?.latitude],
      };

      if (sosUserData) {
        const formatedSosData = {
          location: data.location ? location : null,
          status: data.status,
          threat: data.threat,
        };
        if (sosUserData.status == 'active') {
          delete formatedSosData.status;
        }
        const updatedSosUserData = await this.sosEventModel.update(
          formatedSosData,
          { where: { userId: user.id } },
        );
        console.log('updatedSosUserData...........', updatedSosUserData);
        return updatedSosUserData;
      } else {
        const createdSosUserData = await this.sosEventModel.create({
          location: data.location ? location : null,
          userId: user.id,
          status: data.status,
        });
        console.log('createdSosUserData...........', createdSosUserData);
        return createdSosUserData;
      }
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
        userType: 'child',
      });
    }

    return { otpSent: true };
  }

  generateOtp(characters: number): string {
    if (process.env.CURRENT_ENVIRONMENT == 'staging') {
      return '1234';
    }
    return Math.floor(
      10 ** (characters - 1) + Math.random() * (9 * 10 ** (characters - 1)),
    ).toString();
  }
}
