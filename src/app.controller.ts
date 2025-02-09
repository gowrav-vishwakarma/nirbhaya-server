import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import businessCategories from './businessCategories.json';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('business-categories')
  getBusinessCategories() {
    return businessCategories;
  }

  @Post('check-version')
  checkVersion(@Body() body: { currentVersion: string; deviceId?: string }) {
    console.log('Checking version');
    return this.appService.checkVersion(
      body.currentVersion,
      body.deviceId || 'anydeviceId',
    );
  }
}
