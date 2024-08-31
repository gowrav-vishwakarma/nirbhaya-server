import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { GetUser } from './getuser.decorator';
import { UserJWT } from 'src/dto/user-jwt.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() SignUpDto: any): Promise<{ token: string }> {
    return this.authService.signUp(SignUpDto);
  }

  // @UseGuards(AuthGuard)
  @Post('/login')
  logIn(@Body() LogInDto: any): Promise<any> {
    return this.authService.logIn(LogInDto);
  }
  @Post('/user-emergency-contect-add')
  userEmergencyContactAdd(@Body() data: any): Promise<any> {
    return this.authService.userEmergencyContactAdd(data);
  }
  @Post('/user-profile-update')
  userProfileUpdate(@Body() data: any): Promise<any> {
    return this.authService.userProfileUpdate(data);
  }

  @UseGuards(AuthGuard)
  @Post('/checkLoggedIn')
  checkLoggedIn(@GetUser() user: UserJWT) {
    return user;
  }

  @Post('sendOtp')
  async sendOtp(
    @Body('mobileNumber') mobileNumber: string,
  ) {
    return this.authService.send_otp(mobileNumber);
  }
}
