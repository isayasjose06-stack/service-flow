import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    service: {
      findUnique: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Conversation', () => {
    it('1. Cliente puede obtener conversación', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1' });
      mockPrisma.conversation.upsert.mockResolvedValue({ id: 'c1', clientId: 'client1', technicianId: 'tech1' });
      const res = await service.getConversationForParticipant('client1', 's1');
      expect(res.id).toBe('c1');
    });

    it('2. Técnico puede obtener conversación', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1' });
      mockPrisma.conversation.upsert.mockResolvedValue({ id: 'c1' });
      await expect(service.getConversationForParticipant('tech1', 's1')).resolves.toBeDefined();
    });

    it('3. Usuario no participante recibe 403/404', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1' });
      await expect(service.getConversationForParticipant('hacker', 's1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Messages', () => {
    it('8. Cliente puede enviar', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({ id: 'c1', clientId: 'client1', technicianId: 'tech1' });
      mockPrisma.message.create.mockResolvedValue({ id: 'm1', content: 'hello' });
      const res = await service.sendMessage('client1', 'c1', 'hello');
      expect(res.id).toBe('m1');
    });

    it('10. Usuario externo no puede enviar', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({ id: 'c1', clientId: 'client1', technicianId: 'tech1' });
      await expect(service.sendMessage('hacker', 'c1', 'hello')).rejects.toThrow(ForbiddenException);
    });

    it('15. Mensajes se recuperan paginados', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({ id: 'c1', clientId: 'client1', technicianId: 'tech1' });
      mockPrisma.message.findMany.mockResolvedValue([{ id: 'm1' }]);
      const res = await service.getMessages('client1', 'c1', 10);
      expect(res).toHaveLength(1);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    });
  });

  describe('Read / Unread', () => {
    it('16. Usuario puede marcar mensajes recibidos como leídos', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({ id: 'c1', clientId: 'client1', technicianId: 'tech1' });
      mockPrisma.message.updateMany.mockResolvedValue({ count: 1 });
      await service.markAsRead('client1', 'c1');
      expect(mockPrisma.message.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ senderId: { not: 'client1' }, isRead: false })
        })
      );
    });

    it('19. Unread count correcto', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({ id: 'c1', clientId: 'client1', technicianId: 'tech1' });
      mockPrisma.message.count.mockResolvedValue(5);
      const res = await service.getUnreadCount('client1', 'c1');
      expect(res.count).toBe(5);
      expect(mockPrisma.message.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ senderId: { not: 'client1' }, isRead: false }) })
      );
    });
  });
});

