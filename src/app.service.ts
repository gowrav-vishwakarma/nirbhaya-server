import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  checkVersion(currentVersion: string) {
    return {
      skipUpdate: false,
      latestVersion: '0.0.199',
      latestIosVersion: '0.0.199',
      latestAndroidVersion: '0.0.213',
      forceUpdate: false,
      minimumVersion: '0.0.199',
      androidUpdateUrl:
        'https://play.google.com/store/apps/details?id=com.xavoc.shoutout',
      iosUpdateUrl: 'https://apps.apple.com/app/6738719612',
    };
  }
}
