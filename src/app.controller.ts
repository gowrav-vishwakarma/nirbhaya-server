import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Cron } from '@nestjs/schedule';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('check-version')
  checkVersion(@Body() body: { currentVersion: string }) {
    return this.appService.checkVersion(body.currentVersion);
  }
}
