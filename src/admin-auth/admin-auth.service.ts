import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Admin } from 'src/models/Admin';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';
import * as bcrypt from 'bcrypt';
import AclRolePermissions from 'src/models/AclRolePermissions';
import AclEntityActions from 'src/models/AclEntityActions';
import { Op } from 'sequelize';
import AclRoles from 'src/models/AclRoles';
@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(Admin)
    private adminModel: typeof Admin,
    @InjectModel(AclRolePermissions)
    private aclRolePermissions: typeof AclRolePermissions,
    @InjectModel(AclEntityActions)
    private aclEntityActions: typeof AclEntityActions,
    @InjectModel(AclRoles)
    private aclRoles: typeof AclRoles,
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
    let permissionsData;
    if (user && user.roleId) {
      permissionsData = await this.aclRoles.findOne({
        where: {
          id: user.roleId,
        },
      });
    }
    console.log('permissonData..', permissionsData);
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
        routes: permissionsData?.permissions?.routes || [],
      },
    };
  }
  async filterPermittedActions(
    baseModel: string,
    roleId: number,
    appName: string,
    modelActions: any,
  ): Promise<any> {
    const data = await this.aclEntityActions.findAll({
      attributes: ['Action'],
      where: {
        BaseModel: baseModel,
        appName: appName,
        // application: application,
      },
      include: {
        model: this.aclRolePermissions,
        as: 'permissions',
        where: {
          role_id: roleId,
          status: 1,
        },
      },
    });

    const actionList = data.map((item) => item.Action);
    // Keep only actions that are in actionList
    return Object.keys(modelActions).reduce((filteredActions, key) => {
      // console.log('key checking - ', key);
      if (actionList.includes(key)) {
        filteredActions[key] = modelActions[key];
      }
      return filteredActions;
    }, {});
  }
}
