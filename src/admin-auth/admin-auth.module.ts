import { Module } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';

@Module({
  providers: [AdminAuthService],
  controllers: [AdminAuthController]
})
export class AdminAuthModule {}
