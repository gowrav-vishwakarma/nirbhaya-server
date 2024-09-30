import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { GetUser } from './getuser.decorator';
import { UserJWT } from 'src/dto/user-jwt.dto';
import { SosService } from './sos/sos.service';
import { UserProfileUpdateDto } from './dto/user-profile-update.dto';
import { SuggestionDto } from './dto/suggestion.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sosService: SosService,
  ) {}

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
  userProfileUpdate(
    @Body() data: UserProfileUpdateDto,
    @GetUser() user: UserJWT,
  ): Promise<any> {
    return this.authService.userProfileUpdate(data, user);
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

  @Post('validate-phone')
  async validatePhone(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.validatePhone(phoneNumber);
  }

  // Add this new endpoint
  @UseGuards(AuthGuard)
  @Get('volunteers-nearby')
  async getVolunteersNearby(
    @Query('location') location: string,
    @Query('range') range: number,
  ) {
    const [latitude, longitude] = location.split(',').map(Number);
    return this.authService.getVolunteersNearby(latitude, longitude, range);
  }

  @UseGuards(AuthGuard)
  @Post('logout') // {{ edit_2 }}
  async logout(@GetUser() user: UserJWT) {
    return this.authService.logout(user.id); // Call the logout service method
  }

  @UseGuards(AuthGuard)
  @Post('/apply-community')
  async applyToCommunity(@Body() data: any, @GetUser() user: UserJWT) {
    return this.authService.applyToCommunity(data, user.id);
  }

  @UseGuards(AuthGuard)
  @Post('notifications/:id/discard') // {{ edit_4 }}
  async discardNotification(@Param('id') id: string, @GetUser() user: UserJWT) {
    return this.authService.discardNotification(parseInt(id), user.id);
  }

  @Get('get-presigned-url')
  @UseGuards(AuthGuard)
  async getPresignedUrl(
    @Query('sosEventId') sosEventId: number,
    @Query('fileName') fileName: string,
    @Query('contentType') contentType: string,
  ) {
    const presignedUrl = await this.sosService.getPresignedUrlForUpload(
      sosEventId,
      fileName,
      contentType,
    );
    return { presignedUrl };
  }

  // Add new endpoints for emergency contact management
  @UseGuards(AuthGuard)
  @Get('emergency-contacts')
  async getEmergencyContacts(@GetUser() user: UserJWT) {
    return this.authService.getEmergencyContacts(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('approve-emergency-contact/:id')
  async approveEmergencyContact(
    @Param('id') id: string,
    @GetUser() user: UserJWT,
  ) {
    return this.authService.approveEmergencyContact(parseInt(id), user.id);
  }

  @UseGuards(AuthGuard)
  @Post('remove-emergency-contact/:id')
  async removeEmergencyContact(
    @Param('id') id: string,
    @GetUser() user: UserJWT,
  ) {
    return this.authService.removeEmergencyContact(parseInt(id), user.id);
  }

  // Add this new endpoint
  @UseGuards(AuthGuard)
  @Get('emergency-contacts-status')
  async getEmergencyContactsStatus(@GetUser() user: UserJWT) {
    return this.authService.getEmergencyContactsStatus(user.id);
  }

  // Add a new endpoint to validate a referral ID
  @Get('validate-referral/:referralId')
  async validateReferral(@Param('referralId') referralId: string) {
    return this.authService.validateReferral(referralId);
  }

  // Remove methods related to multipart upload

  @UseGuards(AuthGuard)
  @Get('suggestions')
  async getSuggestions(@GetUser() user: UserJWT) {
    return this.authService.getSuggestions(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('suggestions')
  async createSuggestion(
    @GetUser() user: UserJWT,
    @Body() suggestionDto: SuggestionDto,
  ) {
    return this.authService.createSuggestion(user.id, suggestionDto);
  }

  @UseGuards(AuthGuard)
  @Put('suggestions/:id')
  async updateSuggestion(
    @GetUser() user: UserJWT,
    @Param('id') id: number,
    @Body() suggestionDto: SuggestionDto,
  ) {
    return this.authService.updateSuggestion(user.id, id, suggestionDto);
  }
}
