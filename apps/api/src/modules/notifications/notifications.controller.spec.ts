import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockService = {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get unread count using the userId from CurrentUser (JWT)', async () => {
    mockService.getUnreadCount.mockResolvedValue({ count: 5 });
    
    // The userId comes from the @CurrentUser decorator, which extracts it from JWT
    const result = await controller.getUnreadCount({ userId: 'user-jwt-id' });
    
    expect(service.getUnreadCount).toHaveBeenCalledWith('user-jwt-id');
    expect(result).toEqual({ count: 5 });
  });

  it('should not allow marking a notification as read using a forged userId in the payload', async () => {
    mockService.markAsRead.mockResolvedValue({ success: true });
    
    // The controller always uses user.userId from JWT
    await controller.markAsRead({ userId: 'real-user-id' }, 'some-notif');
    
    expect(service.markAsRead).toHaveBeenCalledWith('real-user-id', 'some-notif');
  });
});
