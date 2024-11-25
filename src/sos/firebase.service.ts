import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { Message } from 'firebase-admin/messaging';

type NotificationPriority = 'max' | 'high' | 'default' | 'low' | 'min';

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
  };
  invalidToken?: boolean;
}

@Injectable()
export class FirebaseService {
  private app: admin.app.App | null = null;
  private readonly logger = new Logger(FirebaseService.name);
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      if (!projectId) {
        this.logger.warn(
          'Firebase project ID is not set. Firebase features will be disabled.',
        );
        return;
      }

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

      this.isInitialized = true;
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
  ): Promise<NotificationResult> {
    if (!this.isInitialized) {
      this.logger.warn(
        'Firebase is not initialized. Cannot send notification.',
      );
      return {
        success: false,
        error: {
          code: 'firebase/not-initialized',
          message: 'Firebase is not initialized',
        },
      };
    }

    const message: Message = {
      notification: {
        title,
        body,
      },
      data: {
        sosEventId,
        location,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        screen: '/notifications',
        ...Object.entries(additionalData || {}).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: String(value),
          }),
          {},
        ),
      },
      android: {
        priority: 'high' as const,
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          priority: 'high' as NotificationPriority,
          defaultSound: true,
          channelId: 'high_importance_channel',
          sound: 'default',
          visibility: 'public',
          vibrateTimingsMillis: [200, 500, 200, 500],
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
          'apns-expiration': '0',
        },
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
            category: 'SOS_CATEGORY',
            'content-available': 1,
            'mutable-content': 1,
            priority: 10,
            'thread-id': sosEventId,
          },
          sosEventId,
          location,
          screen: '/notifications',
          ...additionalData,
        },
      },
      token,
    };

    try {
      const response = await this.app.messaging().send(message);
      this.logger.log('Successfully sent message:', response);
      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      this.logger.error('Error sending message:', error);

      // Check if the error is due to an invalid token
      const isInvalidToken =
        error?.errorInfo?.code ===
          'messaging/registration-token-not-registered' ||
        error?.errorInfo?.code === 'messaging/invalid-registration-token';

      return {
        success: false,
        error: {
          code: error?.errorInfo?.code || 'unknown',
          message: error?.errorInfo?.message || error.message,
        },
        invalidToken: isInvalidToken,
      };
    }
  }
}
