import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtModuleAsyncOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'src/models/User';
// import { SequelizeModule } from '@nestjs/sequelize';
// import { User } from 'src/models/user.model';

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
    SequelizeModule.forFeature([User])
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
