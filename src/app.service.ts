import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  checkVersion(currentVersion: string) {
    return {
      latestVersion: '0.0.185',
      forceUpdate: false,
      minimumVersion: '0.0.185',
      androidUpdateUrl:
        'https://play.google.com/store/apps/details?id=com.nirbhaya.app',
      iosUpdateUrl: 'https://apps.apple.com/app/id6444352309',
    };
  }
}
