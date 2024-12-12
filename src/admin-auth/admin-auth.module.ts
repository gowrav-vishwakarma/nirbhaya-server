import { forwardRef, Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
// import { AdminAuthService } from './admin-auth.service';
import { JwtModule, JwtModuleAsyncOptions, JwtService } from '@nestjs/jwt';
import { Admin } from '../models/Admin';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthGuard } from './admin-auth.guard';
import AclRolePermissions from 'src/models/AclRolePermissions';
import AclEntityActions from 'src/models/AclEntityActions';
import AclRoles from 'src/models/AclRoles';
import { CommunityPost } from 'src/models/CommunityPost';
import { PostComment } from 'src/models/PostComment';
import { PostLike } from 'src/models/PostLike';
// import { AdminAuthGuard } from './';
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'abc_secret',
        signOptions: {
          expiresIn: configService.get<string | number>('JWT_EXPIRE') || '24h',
        },
      }),
    } as JwtModuleAsyncOptions),
    SequelizeModule.forFeature([
      Admin,
      AclRolePermissions,
      AclEntityActions,
      AclRoles,
      CommunityPost,
      PostComment,
      PostLike,
    ]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, JwtService, AdminAuthGuard],
  exports: [AdminAuthService, JwtModule],
})
export class AdminAuthModule {}
