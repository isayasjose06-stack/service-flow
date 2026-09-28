import { Controller, Get, Patch, Param, Query, UseGuards, Post, Body, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GetNotificationsDto, CreatePushSubscriptionDto } from './dto/notification.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: any,
    @Query() query: GetNotificationsDto
  ) {
    return this.notificationsService.getUserNotifications(user.userId, query.page || 1, query.limit || 20);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') notificationId: string
  ) {
    return this.notificationsService.markAsRead(user.userId, notificationId);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Post('push-subscription')
  async addPushSubscription(
    @CurrentUser() user: any,
    @Body() dto: CreatePushSubscriptionDto
  ) {
    return this.notificationsService.addPushSubscription(user.userId, dto.endpoint, dto.p256dh, dto.auth);
  }

  @Delete('push-subscription/:endpoint')
  async removePushSubscription(
    @CurrentUser() user: any,
    @Param('endpoint') endpoint: string
  ) {
    return this.notificationsService.removePushSubscription(user.userId, decodeURIComponent(endpoint));
  }
}
