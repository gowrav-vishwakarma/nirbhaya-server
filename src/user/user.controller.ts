import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth-module/auth.guard';
import { GetUser } from '../auth-module/getuser.decorator';
import { UserJWT } from '../dto/user-jwt.dto';
import { UserProfileUpdateDto } from '../auth-module/dto/user-profile-update.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/user-profile-update')
  @UseGuards(AuthGuard)
  userProfileUpdate(
    @Body() data: UserProfileUpdateDto,
    @GetUser() user: UserJWT,
  ): Promise<any> {
    return this.userService.userProfileUpdate(data, user);
  }

  @UseGuards(AuthGuard)
  @Get('emergency-contacts')
  async getEmergencyContacts(@GetUser() user: UserJWT) {
    return this.userService.getEmergencyContacts(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('approve-emergency-contact/:id')
  async approveEmergencyContact(
    @Param('id') id: string,
    @GetUser() user: UserJWT,
  ) {
    return this.userService.approveEmergencyContact(parseInt(id), user.id);
  }

  @UseGuards(AuthGuard)
  @Post('remove-emergency-contact/:id')
  async removeEmergencyContact(
    @Param('id') id: string,
    @GetUser() user: UserJWT,
  ) {
    return this.userService.removeEmergencyContact(parseInt(id), user.id);
  }

  @UseGuards(AuthGuard)
  @Get('emergency-contacts-status')
  async getEmergencyContactsStatus(@GetUser() user: UserJWT) {
    return this.userService.getEmergencyContactsStatus(user.id);
  }

  @Get('validate-referral/:referralId')
  async validateReferral(@Param('referralId') referralId: string) {
    return this.userService.validateReferral(referralId);
  }
}
