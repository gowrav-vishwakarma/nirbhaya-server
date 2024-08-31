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
import * as bcrypt from 'bcrypt';
import { User } from 'src/models/User';
import { EmergencyContact } from 'src/models/EmergencyContact';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(EmergencyContact)
    private readonly emergencyContactModel: typeof EmergencyContact,
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
    };

    const user = await this.userModel.findOne({
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

      return { success: true, message: 'User profile updated successfully' };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        message: 'An error occurred during profile update',
        error,
      };
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
          `User with mobile number ${contectData.number} not found`,
        );
        return;
      }
      await this.emergencyContactModel.create({
        userId: contectData.userId,
        contactName: contectData.name,
        contactPhone: contectData.number,
        isAppUser: true,
      });
      return { message: 'Emergency contact updated successfully' };
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
}
