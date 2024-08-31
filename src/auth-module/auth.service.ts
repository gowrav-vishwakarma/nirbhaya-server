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
// import * as bcrypt from 'bcrypt';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';
// import axios, { Method } from 'axios';
import { UserLocation } from 'src/models/UserLocation';
import { SosEvent } from 'src/models/SosEvent';

import { ValidationException } from '../qnatk/src/Exceptions/ValidationException';
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

  //async login(@Body() loginDto: { username: string; password: string; servicetype: string; }) {
  // async logIn(logInDto, t?: Transaction): Promise<any> {
  //   const { username, password, servicetype } = logInDto;

  //   console.log('call login api', username, password, servicetype);
  //   let userCond: any = {
  //     email: username,
  //   };

  //   // const user = await this.userModel.findOne({
  //   //   attributes: [
  //   //     'id',
  //   //     'first_name',
  //   //     'last_name',
  //   //     'mobile',
  //   //     'email',
  //   //     'userType',
  //   //     'password',
  //   //     'profile_id',
  //   //     'partnerId',
  //   //     'partnerInfo',
  //   //     'secretKey',
  //   //     'service',
  //   //   ],
  //   //   where: userCond,
  //   //   raw: true,
  //   //   transaction: t,
  //   // });

  //   // if (!user) {
  //   //   throw new HttpException('Unauthorized access.', HttpStatus.UNAUTHORIZED);
  //   // }

  //   // const isPasswordValid = await bcrypt.compare(password, user.password);

  //   // if (!isPasswordValid) {
  //   //   throw new HttpException('Unauthorized access.', HttpStatus.UNAUTHORIZED);
  //   // }

  //   // delete user.password;

  //   // const token = this.jwtService.sign(...user);

  //   // return {
  //   //   user,
  //   // };
  // }

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
      ],
      where: userCond,
      raw: true,
      transaction: t,
    });

    if (!user) {
      throw new HttpException('Unauthorized access.', HttpStatus.UNAUTHORIZED);
    }

    delete user.otp;

    const tokenPayload = {
      ...user,
    };

    const token = this.jwtService.sign(tokenPayload);

    //if (!passwordChange) {
    await this.userModel.update(
      { token: token },
      {
        where: {
          id: user.id,
        },
        transaction: t,
      },
    );
    //}

    return {
      ...tokenPayload,
      token,
    };
  }

  async userProfileUpdate(data: any): Promise<any> {
    try {
      console.log('update data...', data);

      // Update the user details
      const updateResult = await this.userModel.update(
        { phoneNumber: data.mobileNumber, name: data.name },
        {
          where: {
            phoneNumber: data.mobileNumber,
          },
        },
      );

      // Check if the update was successful
      if (updateResult[0] === 0) {
        console.log('No user found with the given phone number');
        return { success: false, message: 'No user found' };
      }

      // Handle emergency contacts if provided
      if (data.emergencyContacts && data.emergencyContacts.length > 0) {
        await this.userEmergencyContactAdd(data.emergencyContacts);
      }
      if (data.notificationLocations && data.notificationLocations.length > 0) {
        await this.userLoactionAdd(data.notificationLocations);
      }

      return { success: true, message: 'User profile updated successfully' };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new BadRequestException(error);
    }
  }
  async userEmergencyContactAdd(data: any): Promise<any> {
    console.log('user,,,,,,,,', data);

    for (const contectData of data) {
      const user = await this.userModel.findOne({
        where: {
          phoneNumber: contectData.number,
        },
      });
      console.log('user........', user);
      if (!user) {
        throw new BadRequestException(
          `Emergency contact User with mobile number ${contectData.number} not found`,
        );
        return;
      }
      await this.emergencyContactModel.create({
        userId: 1,
        contactName: contectData.name,
        contactPhone: contectData.number,
        isAppUser: true,
      });
      return { message: 'Emergency contact updated successfully' };
    }
  }

  async userLoactionAdd(data: any): Promise<any> {
    console.log(data);
    for (const locationData of data) {
      console.log('locationData.........', locationData);

      const location = {
        type: 'Point',
        coordinates: [locationData.longitude, locationData.latitude],
      };
      const user = await this.userLocationModel.create({
        name: locationData.name,
        userId: 1,
        location: location,
      });
      console.log('user........', user);
      return { message: 'User Location updated successfully' };
    }
  }

  // async getLocationFromCoordinates(
  //   latitude: number,
  //   longitude: number,
  // ): Promise<string> {
  //   console.log('llllllll', latitude, longitude);

  //   try {
  //     const response = await axios.get(
  //       'https://nominatim.openstreetmap.org/reverse',
  //       {
  //         params: {
  //           lat: Number(latitude),
  //           lon: Number(longitude),
  //           format: 'json',
  //         },
  //       },
  //     );

  //     if (response.data && response.data.display_name) {
  //       return response.data.display_name;
  //     }

  //     return 'Location not found';
  //   } catch (error) {
  //     console.error('Error fetching location:', error);
  //     return 'Error fetching location';
  //   }
  // }

  async sosLocationCrud(data: any): Promise<any> {
    try {
      console.log('data...........', data);
      const sosUserData = await this.sosEventModel.findOne({
        where: { userId: data.userId },
        raw: true,
      });

      const location = {
        type: 'Point',
        coordinates: [data.location.longitude, data.location.latitude],
      };

      if (sosUserData) {
        const formatedSosData = {
          location: location,
          status: data.status,
        };
        if (sosUserData.status == 'active') {
          delete formatedSosData.status;
        }
        const updatedSosUserData = await this.sosEventModel.update(
          formatedSosData,
          { where: { userId: data.userId } },
        );
        console.log('updatedSosUserData...........', updatedSosUserData);
        return updatedSosUserData;
      } else {
        const createdSosUserData = await this.sosEventModel.create({
          location,
          userId: data.userId,
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
        // 'status',
      ],
      where: {
        phoneNumber: mobileNumber,
      },
      raw: true,
    });
    console.log('existingUser...........', existingUser);

    // if (
    //   existingUser.status == 'InActive' ||
    //   existingUser.status == 'Rejected' ||
    //   existingUser.status == 'Blocked'
    // ) {
    //   throw new ValidationException({
    //     mobile: [
    //       `Your account is ${existingUser.status}. Please connect to Nebula Slice.`,
    //     ],
    //   });
    // }
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

  // async generateAndSendOtp(
  //   id: number,
  //   toMobile: string = null,
  // ) {
  //   console.log(purpose,);
  //   const user = await this.userModel.findOne({
  //     attributes: ['mobile'],
  //     where: {
  //       id,
  //     },
  //     raw: true,
  //   });
  //   if (!user) {
  //     throw new ValidationException({
  //       uniqueId: ['User not found'],
  //     });
  //   }
  //   const newOtp = this.generateOtp(4);
  //   await this.userModel.update(
  //     { otp: newOtp },
  //     {
  //       where: {
  //         id,
  //       },
  //     },
  //   );
  //   let otpMobile = user.mobile;

  //   if (toMobile && toMobile.length == 10) {
  //     otpMobile = toMobile;
  //     if (!toCountryCode) {
  //       throw new ValidationException({
  //         toCountryCode: ['Country Code is required'],
  //       });
  //     }
  //   }
  //     // await this.smsService.sendOtp({
  //     //   template: 'OTP SMS Template',
  //     //   mobile: otpMobile,
  //     //   countryCode: '+91',
  //     //   replaceData: {
  //     //     purpose: purpose,
  //     //     otp: newOtp,
  //     //     mins: '10',
  //     //   },
  //     // });

  //   // TODO: sendOtp to whatsapp

  //   return {
  //     message: 'Otp Sent',
  //   };
  // }
}
