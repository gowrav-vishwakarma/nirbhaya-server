import { Body, Controller, Post } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}
  @Post('/login')
  logIn(@Body() LogInDto: any): Promise<any> {
    return this.adminAuthService.logIn(LogInDto);
  }
}
