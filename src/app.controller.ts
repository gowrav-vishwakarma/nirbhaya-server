import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AppConfigService } from './app-config/app-config.service';
import businessCategories from './businessCategories.json';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('business-categories')
  getBusinessCategories() {
    return businessCategories;
  }

  /**
   * Public runtime settings + version info. Unauthenticated on purpose: clients
   * fetch it at startup, before login. Contains no secrets.
   */
  @Get('app-config')
  @Header('Cache-Control', 'public, max-age=60')
  async getAppConfig(@Query('deviceId') deviceId?: string) {
    const [config, version] = await Promise.all([
      this.appConfigService.getPublicConfig(),
      this.appConfigService.getVersionInfo(deviceId),
    ]);
    return { config, version, serverTime: new Date().toISOString() };
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
