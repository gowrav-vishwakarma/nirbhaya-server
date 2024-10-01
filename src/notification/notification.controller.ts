import { Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth-module/auth.guard';
import { GetUser } from '../auth-module/getuser.decorator';
import { UserJWT } from '../dto/user-jwt.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getNotifications(@GetUser() user: UserJWT) {
    return this.notificationService.getNotifications(user.id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/accept')
  async acceptNotification(@Param('id') id: string, @GetUser() user: UserJWT) {
    return this.notificationService.acceptNotification(parseInt(id), user.id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/discard')
  async discardNotification(@Param('id') id: string, @GetUser() user: UserJWT) {
    return this.notificationService.discardNotification(parseInt(id), user.id);
  }

  @UseGuards(AuthGuard)
  @Get('unread-count')
  async getUnreadNotificationCount(@GetUser() user: UserJWT) {
    return this.notificationService.getUnreadNotificationCount(user.id);
  }
}
