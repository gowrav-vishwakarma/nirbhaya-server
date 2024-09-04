import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private app: admin.app.App | null = null;
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.getPrivateKey();
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          'Firebase credentials are not fully configured. Firebase features will be disabled.',
        );
        return;
      }

      const adminConfig: ServiceAccount = {
        projectId,
        privateKey,
        clientEmail,
      };

      this.app = admin.initializeApp({
        credential: admin.credential.cert(adminConfig),
        databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
      });

      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error.stack);
      // Don't throw an error, just log it and continue without Firebase
    }
  }

  private getPrivateKey(): string | null {
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    if (!privateKey) {
      return null;
    }

    return privateKey.includes('-----BEGIN PRIVATE KEY-----')
      ? privateKey.replace(/\\n/g, '\n')
      : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    sosEventId: string,
    location: string,
    additionalData?: any,
  ) {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        sosEventId,
        location,
        ...additionalData,
      },
      token,
    };

    try {
      const response = await this.app.messaging().send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.log('Error sending message:', error);
    }
  }
}
