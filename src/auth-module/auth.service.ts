import { JwtService } from '@nestjs/jwt';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from 'src/models/User';
import { ValidationException } from '../qnatk/src/Exceptions/ValidationException';
import { UtilityService } from 'src/utility/utility.service';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly utilityService: UtilityService,
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
      otp:otp,
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
        phoneNumber :mobileNumber,
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
    const newOtp = await this.utilityService.generateOtp(4);

    if (
      existingUser
    ) {
      await this.userModel.update(
        { otp: newOtp },
        {
          where: {
            id: existingUser.id,
          },
        },
      );

    }else {
      existingUser = await this.userModel.create( { otp: newOtp, phoneNumber: mobileNumber, userType: 'child' } );
    }


    return {otpSent:true};
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
  //   const newOtp = this.utilityService.generateOtp(4);
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
