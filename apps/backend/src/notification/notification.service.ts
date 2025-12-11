import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { PrismaService } from '~/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('FIREBASE_APP') private firebaseApp: admin.app.App,
    private readonly prisma: PrismaService,
  ) {}

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      data: data
        ? Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]))
        : undefined,
    };

    try {
      await this.firebaseApp.messaging().send(message);
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Optionally, handle token invalidation or retries
    }
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (user?.fcmToken) {
        await this.sendPushNotification(user.fcmToken, title, body, data);
      } else {
        console.warn(`No FCM token found for user ${userId}`);
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }
}
