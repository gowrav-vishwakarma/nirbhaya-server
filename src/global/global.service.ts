import { Injectable } from '@nestjs/common';
import * as randomstring from 'randomstring';
import { Capitalization } from 'randomstring';
@Injectable()
export class GlobalService {
  updateEventCount(data, type) {
    console.log(data, type);
    return 'true';
  }

  async getDashboardData() {
    const userCountData = 3;
  }

  generateRandomString(
    length: number = 13,
    charset: string = 'hex',
    capitalization: Capitalization = 'uppercase',
  ): string {
    return randomstring.generate({
      length,
      charset,
      capitalization,
    });
  }
}
