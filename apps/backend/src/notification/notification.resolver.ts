import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { PrismaService } from '~/prisma/prisma.service';

import { NotificationService } from './notification.service';

@Resolver()
export class NotificationResolver {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => Boolean, { description: 'Register device FCM token for push notifications' })
  async registerDeviceToken(
    @Args('token') token: string,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    try {
      // Store the FCM token in the user's record
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmToken: token },
      });
      console.log(`FCM token registered for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      return false;
    }
  }

  @Mutation(() => Boolean, { description: 'Send test push notification to device' })
  async sendTestNotification(
    @Args('token') token: string,
    @Args('title') title: string,
    @Args('body') body: string,
  ): Promise<boolean> {
    try {
      await this.notificationService.sendPushNotification(token, title, body);
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  @Mutation(() => Boolean, { description: 'Send push notification to a user by their ID' })
  async sendNotificationToUser(
    @Args('userId') userId: string,
    @Args('title') title: string,
    @Args('body') body: string,
  ): Promise<boolean> {
    try {
      await this.notificationService.sendNotificationToUser(userId, title, body);
      return true;
    } catch (error) {
      console.error('Failed to send notification to user:', error);
      return false;
    }
  }
}
