import { JwtService } from '@nestjs/jwt';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
// import { User } from 'src/models/user.model';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    // @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async signUp(signUpDto: any): Promise<any> {
    return signUpDto;
  }

  //async login(@Body() loginDto: { username: string; password: string; servicetype: string; }) {
  async logIn(logInDto, t?: Transaction): Promise<any> {
    const { username, password, servicetype } = logInDto;

    console.log('call login api', username, password, servicetype);
    let userCond: any = {
      email: username,
    };

    // const user = await this.userModel.findOne({
    //   attributes: [
    //     'id',
    //     'first_name',
    //     'last_name',
    //     'mobile',
    //     'email',
    //     'userType',
    //     'password',
    //     'profile_id',
    //     'partnerId',
    //     'partnerInfo',
    //     'secretKey',
    //     'service',
    //   ],
    //   where: userCond,
    //   raw: true,
    //   transaction: t,
    // });

    // if (!user) {
    //   throw new HttpException('Unauthorized access.', HttpStatus.UNAUTHORIZED);
    // }

    // const isPasswordValid = await bcrypt.compare(password, user.password);

    // if (!isPasswordValid) {
    //   throw new HttpException('Unauthorized access.', HttpStatus.UNAUTHORIZED);
    // }

    // delete user.password;

    // const token = this.jwtService.sign(...user);

    // return {
    //   user,
    // };
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
