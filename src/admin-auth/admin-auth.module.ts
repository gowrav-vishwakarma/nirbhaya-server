import { forwardRef, Module } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleAsyncOptions } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { Admin } from 'src/models/Admin';
import { StreamingModule } from 'src/streaming/streaming.module';
@Module({
  // imports: [
  //   ConfigModule,
  //   JwtModule.registerAsync({
  //     imports: [ConfigModule],
  //     inject: [ConfigModule],
  //     useFactory: async (configService: ConfigService) => ({
  //       secret: configService.get<string>('JWT_SECRET') || 'abc_secret',
  //       signOptions: {
  //         expiresIn: configService.get<string | number>('JWT_EXPIRE') || '24h',
  //       },
  //     }),
  //   } as JwtModuleAsyncOptions),
  //   SequelizeModule.forFeature([Admin]),
  //   forwardRef(() => StreamingModule),
  // ],
  providers: [AdminAuthService],
  controllers: [AdminAuthController],
})
export class AdminAuthModule {}
