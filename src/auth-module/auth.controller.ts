import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { GetUser } from './getuser.decorator';
import { UserJWT } from 'src/dto/user-jwt.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('shared-post')
  async getMyPosts(
    @Query('postId') postId: number,
    @Query('status') status: string,
  ) {
    return this.authService.findSharedPost({ postId, status });
  }
  @Post('/signup')
  signUp(@Body() SignUpDto: any): Promise<{ token: string }> {
    return this.authService.signUp(SignUpDto);
  }

  @Post('/login')
  logIn(@Body() LogInDto: any): Promise<any> {
    return this.authService.logIn(LogInDto);
  }

  @UseGuards(AuthGuard)
  @Post('/checkLoggedIn')
  checkLoggedIn(@GetUser() user: UserJWT) {
    return user;
  }

  @Post('sendOtp')
  async sendOtp(
    @Body('mobileNumber') mobileNumber: string,
    @Body('platform') platform: object = {},
  ) {
    return this.authService.send_otp(mobileNumber, platform);
  }

  @UseGuards(AuthGuard)
  @Post('update-fcm-token')
  async updateFcmToken(
    @GetUser() user: UserJWT,
    @Body('fcmToken') fcmToken: string,
  ) {
    await this.authService.updateFcmToken(user.id, fcmToken);
    return { message: 'FCM token updated successfully' };
  }

  @Post('validate-phone')
  async validatePhone(
    @Body('phoneNumber') phoneNumber: string,
    @Body('createNew') createNew: boolean = false,
    @Body('name') name: string = ''
  ) {
    return this.authService.validatePhone(phoneNumber, createNew, name);
  }

  @UseGuards(AuthGuard)
  @Post('logout') // {{ edit_2 }}
  async logout(@GetUser() user: UserJWT) {
    return this.authService.logout(user.id); // Call the logout service method
  }
}
