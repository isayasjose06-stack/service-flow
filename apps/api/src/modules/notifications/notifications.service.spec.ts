import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService, CreateNotificationPayload } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailProvider } from './providers/email.provider';
import { PushProvider } from './providers/push.provider';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let emailProvider: EmailProvider;
  let pushProvider: PushProvider;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    }
  };

  const mockEmailProvider = {
    send: jest.fn(),
  };

  const mockPushProvider = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailProvider, useValue: mockEmailProvider },
        { provide: PushProvider, useValue: mockPushProvider },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailProvider = module.get<EmailProvider>(EmailProvider);
    pushProvider = module.get<PushProvider>(PushProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleNotificationEvent', () => {
    it('should create an in-app notification', async () => {
      const payload: CreateNotificationPayload = {
        userId: 'user-1',
        type: NotificationType.MATCH_FOUND,
        title: 'Title',
        body: 'Body'
      };

      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      await service.handleNotificationEvent(payload);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: NotificationType.MATCH_FOUND,
          title: 'Title',
          body: 'Body',
          data: {},
          idempotencyKey: null,
        }
      });
      // Email should not be called since sendEmail is false
      expect(mockEmailProvider.send).not.toHaveBeenCalled();
    });

    it('should handle idempotency (P2002 error)', async () => {
      const payload: CreateNotificationPayload = {
        userId: 'user-1',
        type: NotificationType.MATCH_FOUND,
        title: 'Title',
        body: 'Body',
        idempotencyKey: 'idem-1'
      };

      mockPrisma.notification.create.mockRejectedValue({ code: 'P2002' });

      // Should not throw
      await service.handleNotificationEvent(payload);

      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should dispatch email async and update status to MOCKED_SUCCESS', async () => {
      const payload: CreateNotificationPayload = {
        userId: 'user-1',
        type: NotificationType.MATCH_FOUND,
        title: 'Title',
        body: 'Body',
        sendEmail: true
      };

      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      mockEmailProvider.send.mockResolvedValue(undefined);

      await service.handleNotificationEvent(payload);
      
      // We must wait a tick because dispatchEmail is called asynchronously without await
      await new Promise(process.nextTick);

      expect(mockEmailProvider.send).toHaveBeenCalled();
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { emailStatus: 'MOCKED_SUCCESS' }
      });
    });

    it('should handle email provider failure and update status to FAILED', async () => {
      const payload: CreateNotificationPayload = {
        userId: 'user-1',
        type: NotificationType.MATCH_FOUND,
        title: 'Title',
        body: 'Body',
        sendEmail: true
      };

      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      mockEmailProvider.send.mockRejectedValue(new Error('Provider down'));

      await service.handleNotificationEvent(payload);
      await new Promise(process.nextTick);

      expect(mockEmailProvider.send).toHaveBeenCalled();
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { emailStatus: 'FAILED' }
      });
    });
  });

  describe('markAsRead', () => {
    it('should use updateMany with readAt: null and userId for IDOR protection', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });
      
      await service.markAsRead('user-1', 'notif-1');
      
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) }
      });
    });
  });
});
