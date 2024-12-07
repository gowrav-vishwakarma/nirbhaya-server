import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Admin } from 'src/models/Admin';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(Admin)
    private adminModel: typeof Admin,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async logIn(params: { email: string; password: string }) {
    const { email, password } = params;
    const user = await this.adminModel.findOne({
      where: { email },
    });
    if (!user) {
      throw new ValidationException({
        email: ['User not found'],
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ValidationException({
        password: ['Wrong password'],
      });
    }
    // const sessionCreateObj = {
    //   employeeId: user.id,
    //   userType: 'admin',
    //   // token: token,
    //   deviceId: ip,
    //   deviceInfo,
    //   status: 'Active',
    //   loginTime: new Date(),
    //   autoExpireAt: new Date(new Date().setDate(new Date().getDate() + 10)),
    //   lastUsedAt: new Date(),
    // };
    // const newSession = await this.loginSessionModel.create(sessionCreateObj);
    const tokenData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.phoneNumber,
      role: user.role,
      roleId: user.roleId,
      //   sessionId: newSession.id,
      userType: 'admin',
    };
    // const token = this.jwtService.sign(tokenData);
    const token = this.jwtService.sign(tokenData, {
      secret: this.configService.get<string>('JWT_SECRET') || 'abc_secret',
    });
    // newSession.token = token;
    // await newSession.save();
    return {
      user: {
        ...user.toJSON(),
        userType: 'admin',
        password: undefined,
        username: user.email,
        token: token,
      },
      rolePermissions: {
        menus: [],
        routes: [],
      },
    };
  }
}
