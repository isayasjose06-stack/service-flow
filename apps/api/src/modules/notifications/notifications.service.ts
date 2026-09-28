import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailProvider } from './providers/email.provider';
import { PushProvider } from './providers/push.provider';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
  sendPush?: boolean;
  idempotencyKey?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: EmailProvider,
    private readonly pushProvider: PushProvider
  ) {}

  @OnEvent('notification.send')
  async handleNotificationEvent(payload: CreateNotificationPayload) {
    try {
      let notification;
      
      try {
        notification = await this.prisma.notification.create({
          data: {
            userId: payload.userId,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            idempotencyKey: payload.idempotencyKey || null,
          }
        });
      } catch (err: any) {
        if (err.code === 'P2002' && payload.idempotencyKey) {
          this.logger.warn(`Duplicate notification skipped for idempotency key: ${payload.idempotencyKey}`);
          return;
        }
        throw err;
      }

      this.logger.log(`Created In-App Notification [${notification.id}] for User [${payload.userId}]`);

      if (payload.sendEmail) {
        this.dispatchEmail(payload, notification.id).catch(async err => {
          this.logger.error(`Failed to dispatch email for notification ${notification.id}`, err);
          try { await this.prisma.notification.update({ where: { id: notification.id }, data: { emailStatus: 'FAILED' } }); } catch (e) {}
        });
      }

      if (payload.sendPush) {
        this.dispatchPush(payload, notification.id).catch(async err => {
          this.logger.error(`Failed to dispatch push for notification ${notification.id}`, err);
          try { await this.prisma.notification.update({ where: { id: notification.id }, data: { pushStatus: 'FAILED' } }); } catch (e) {}
        });
      }

    } catch (error) {
      this.logger.error('Failed to handle notification event', error);
    }
  }

  private async dispatchEmail(payload: CreateNotificationPayload, notificationId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return;

    await this.emailProvider.send({
      to: user.email,
      subject: payload.title,
      html: `<p>${payload.body}</p>`,
    });

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { emailStatus: 'MOCKED_SUCCESS' }
    });
  }

  private async dispatchPush(payload: CreateNotificationPayload, notificationId: string) {
    await this.pushProvider.send({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { pushStatus: 'MOCKED_SUCCESS' }
    });
  }

  // --- API Methods for In-App UI ---

  async getUserNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null }
    });
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() }
    });
    
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });
    return { success: true };
  }

  // --- Push Subscription API ---
  async addPushSubscription(userId: string, endpoint: string, p256dh: string, auth: string) {
    try {
      await this.prisma.pushSubscription.create({
        data: {
          userId,
          endpoint,
          p256dh,
          auth
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Idempotent: already exists for this endpoint
        return { success: true };
      }
      throw error;
    }
    return { success: true };
  }

  async removePushSubscription(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint }
    });
    return { success: true };
  }
}
