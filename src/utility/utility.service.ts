import * as randomstring from 'randomstring';
import { Injectable } from '@nestjs/common';
import axios, { Method } from 'axios';
import { URLSearchParams } from 'url';

@Injectable()
export class UtilityService {
  generateOtp(characters: number): string {
    if (process.env.CURRENT_ENVIRONMENT == 'staging') {
      return '1234';
    }
    return Math.floor(
      10 ** (characters - 1) + Math.random() * (9 * 10 ** (characters - 1)),
    ).toString();
  }

  validateMail(email: string): boolean {
    const regexp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexp.test(email);
  }

  validatePhone(phone: string): boolean {
    const regexp = /^\d{10}$/;
    return regexp.test(phone);
  }

  async curlCall(
    url: string,
    data: any,
    method: Method = 'POST',
  ): Promise<any> {
    try {
      console.log('create payment data', data.hash);
      const response = await axios({
        method: method,
        url: url,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        data: new URLSearchParams(data).toString(),
      });
      console.log('payment response.........', response);
      return response.data;
    } catch (error) {
      console.log('error.........', error.response);
      throw new Error(error);
    }
  }
}
