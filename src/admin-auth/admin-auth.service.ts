import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Admin } from 'src/models/Admin';
// import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';

@Injectable()
export class AdminAuthService {
  //   constructor(
  //     @InjectModel(Admin)
  //     private adminModel: typeof Admin,
  //     private readonly jwtService: JwtService,
  //   ) {}
  //   async login(params: { email: string; password: string }) {
  //     const { email, password } = params;
  //     const user = await this.adminModel.findOne({
  //       where: { email },
  //     });
  //     if (!user) {
  //       throw new ValidationException({
  //         email: ['User not found'],
  //       });
  //     }
  //     if (user.password !== password) {
  //       throw new ValidationException({
  //         password: ['Wrong password'],
  //       });
  //     }
  //     let permissionsData;
  //     console.log('user.roleId', user.roleId);
  //     const allRoutes =
  //       permissionsData &&
  //       permissionsData.length &&
  //       permissionsData.map((role) => role.permissions.routes).flat();
  //     const mergedRoutes = [...new Set(allRoutes)];
  //     console.log('permissionsData', permissionsData);
  //     console.log('mergedRoutes', mergedRoutes);
  //     // const sessionCreateObj = {
  //     //   employeeId: user.id,
  //     //   userType: 'admin',
  //     //   // token: token,
  //     //   deviceId: ip,
  //     //   deviceInfo,
  //     //   status: 'Active',
  //     //   loginTime: new Date(),
  //     //   autoExpireAt: new Date(new Date().setDate(new Date().getDate() + 10)),
  //     //   lastUsedAt: new Date(),
  //     // };
  //     // const newSession = await this.loginSessionModel.create(sessionCreateObj);
  //     const tokenData = {
  //       id: user.id,
  //       email: user.email,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //     //   fullName: user.virtualName,
  //       mobile: user.phoneNumber,
  //       role: user.role,
  //       roleId: user.roleId,
  //       //   sessionId: newSession.id,
  //       userType: 'admin',
  //     };
  //     const token = this.jwtService.sign(tokenData);
  //     // newSession.token = token;
  //     // await newSession.save();
  //     return {
  //       user: {
  //         ...user.toJSON(),
  //         userType: 'admin',
  //         password: undefined,
  //         username: user.email,
  //       },
  //       //   session: {
  //       //     id: newSession.id,
  //       //     token: newSession.token,
  //       //     employeeId: newSession.employeeId,
  //       //     // affiliateId: newSession.affiliateId,
  //       //     status: newSession.status,
  //       //     userType: newSession.userType,
  //       //     loginTime: newSession.loginTime,
  //       //     createdAt: newSession.createdAt,
  //       //     updatedAt: newSession.updatedAt,
  //       //   },
  //       rolePermissions: {
  //         menus: [],
  //         routes: mergedRoutes ?? [],
  //       },
  //     };
  //   }
}
