import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { GetUser } from './getuser.decorator';
import { UserJWT } from 'src/dto/user-jwt.dto';
import { Notification } from 'src/models/Notification'; // Add this import

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() SignUpDto: any): Promise<{ token: string }> {
    return this.authService.signUp(SignUpDto);
  }

  @Post('/login')
  logIn(@Body() LogInDto: any): Promise<any> {
    return this.authService.logIn(LogInDto);
  }

  @Post('/user-profile-update')
  @UseGuards(AuthGuard)
  userProfileUpdate(@Body() data: any): Promise<any> {
    return this.authService.userProfileUpdate(data);
  }
  @Post('/sos-update')
  @UseGuards(AuthGuard)
  sosLocationCrud(@Body() data: any, @GetUser() user: UserJWT): Promise<any> {
    console.log('user...........', user);
    return this.authService.sosUpdate(data, user);
  }

  @UseGuards(AuthGuard)
  @Post('/checkLoggedIn')
  checkLoggedIn(@GetUser() user: UserJWT) {
    return user;
  }

  @Post('sendOtp')
  async sendOtp(@Body('mobileNumber') mobileNumber: string) {
    return this.authService.send_otp(mobileNumber);
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

  @UseGuards(AuthGuard)
  @Get('notifications')
  async getNotifications(@GetUser() user: UserJWT) {
    return this.authService.getNotifications(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('notifications/:id/accept')
  async acceptNotification(@Param('id') id: string, @GetUser() user: UserJWT) {
    return this.authService.acceptNotification(parseInt(id), user.id);
  }

  @UseGuards(AuthGuard)
  @Get('notifications/unread-count')
  async getUnreadNotificationCount(@GetUser() user: UserJWT) {
    return this.authService.getUnreadNotificationCount(user.id);
  }
}
