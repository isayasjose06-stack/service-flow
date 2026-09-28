import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@serviceflow/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('services/:serviceId/conversation')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  getConversationForService(
    @CurrentUser('sub') userId: string,
    @Param('serviceId') serviceId: string
  ) {
    return this.chatService.getConversationForParticipant(userId, serviceId);
  }

  @Get('conversations/:id/messages')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  getMessages(
    @CurrentUser('sub') userId: string,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    return this.chatService.getMessages(userId, conversationId, limit ? parseInt(limit, 10) : 50, cursor);
  }

  @Post('conversations/:id/messages')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  sendMessage(
    @CurrentUser('sub') userId: string,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto
  ) {
    return this.chatService.sendMessage(userId, conversationId, dto.content);
  }

  @Post('conversations/:id/read')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id') conversationId: string
  ) {
    return this.chatService.markAsRead(userId, conversationId);
  }

  @Get('conversations/:id/unread-count')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  getUnreadCount(
    @CurrentUser('sub') userId: string,
    @Param('id') conversationId: string
  ) {
    return this.chatService.getUnreadCount(userId, conversationId);
  }
}
