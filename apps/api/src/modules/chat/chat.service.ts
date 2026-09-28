import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async getConversationForParticipant(userId: string, serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) throw new NotFoundException('Servicio no encontrado');
    if (service.clientId !== userId && service.technicianId !== userId) {
      throw new ForbiddenException('No participas en este servicio');
    }

    const conversation = await this.prisma.conversation.upsert({
      where: { serviceId },
      update: {},
      create: {
        serviceId,
        clientId: service.clientId,
        technicianId: service.technicianId,
      },
    });

    return conversation;
  }

  async getConversationById(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });
    if (!conversation) throw new NotFoundException('Conversacion no encontrada');
    if (conversation.clientId !== userId && conversation.technicianId !== userId) {
      throw new ForbiddenException('No participas en esta conversacion');
    }
    return conversation;
  }

  async getMessages(userId: string, conversationId: string, limit: number = 50, cursor?: string) {
    await this.getConversationById(userId, conversationId);

    const take = Math.min(limit, 100);
    
    return this.prisma.message.findMany({
      where: { conversationId },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.getConversationById(userId, conversationId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim()
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    const isClient = conversation.clientId === userId;
    const targetUserId = isClient ? conversation.technicianId : conversation.clientId;

    this.eventEmitter.emit('notification.send', {
      userId: targetUserId,
      type: NotificationType.NEW_MESSAGE,
      title: 'Nuevo Mensaje',
      body: `Has recibido un nuevo mensaje de ${message.sender?.firstName || 'un usuario'}.`,
      data: { conversationId, messageId: message.id },
      sendEmail: true,
      sendPush: true,
      idempotencyKey: `new_message_${message.id}`
    });

    return message;
  }

  async markAsRead(userId: string, conversationId: string) {
    await this.getConversationById(userId, conversationId);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return { success: true };
  }

  async getUnreadCount(userId: string, conversationId: string) {
    await this.getConversationById(userId, conversationId);

    const count = await this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      }
    });

    return { count };
  }
}
