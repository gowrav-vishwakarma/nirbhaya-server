import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // Assuming you're using ConfigModule for configuration
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class SmsService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService, // Use ConfigService to access application config
  ) {}

  async sendMessage(no: string, msg: string, templateId: string): Promise<any> {
    const sendSms = this.configService.get<'true' | 'false'>(
      'SEND_SMS',
      'false',
    );
    if (sendSms !== 'true') {
      console.log(`${no} ${msg}`);
      return `${no} ${msg}<br/>`; // Just for demonstration, in real scenario you might not want to return this.
    }

    const msgEncoded = encodeURIComponent(msg);
    const user = this.configService.get<string>('SMS_USER');
    const senderId = this.configService.get<string>('SMS_SENDER_ID');
    const apiKey = this.configService.get<string>('SMS_API_KEY');

    console.log('msgEncoded >>>>.', msgEncoded);
    console.log('user..... ', user);
    console.log('senderID..... ', senderId);
    console.log('apiKey..... ', apiKey);
    console.log('templateId..... ', templateId);

    const url = `http://sms.stewindia.com/sms-panel/api/http/index.php?username=${user}&apikey=${apiKey}&apirequest=Text&sender=${senderId}&mobile=${no}&message=${msgEncoded}&route=TRANS&TemplateID=${templateId}&format=JSON`;
    console.log('url===.....>>>> ', url);
    // Using HttpService to make the GET request
    // throw new Error('Invalid');
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      console.log('SMS response received', response.data);
      return response.data; // Or handle the response as needed
    } catch (error) {
      // Handle error
      console.error(error);
      // throw new Error('Failed to send SMS');
    }
  }
}
