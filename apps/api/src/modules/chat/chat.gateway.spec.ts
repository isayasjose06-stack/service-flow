import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verify: jest.fn(),
  })),
}));

import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: ChatService;
  let jwtService: JwtService;

  const mockChatService = {
    getConversationById: jest.fn(),
    sendMessage: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        ChatGateway,
        { provide: ChatService, useValue: mockChatService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = mockServer as any;
    chatService = module.get<ChatService>(ChatService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection', () => {
    it('1. WebSocket sin JWT -> rechazado', async () => {
      const mockClient = { handshake: { headers: {} }, disconnect: jest.fn() } as any;
      await gateway.handleConnection(mockClient);
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('2 & 3. Usuario autorizado (CLIENT/TECHNICIAN) -> puede conectarse', async () => {
      const mockClient = { handshake: { query: { token: 'valid-token' }, headers: {} }, data: {}, disconnect: jest.fn() } as any;
      mockJwtService.verify.mockReturnValue({ sub: 'user123', role: 'CLIENT' });
      await gateway.handleConnection(mockClient);
      expect(mockClient.data.user.sub).toBe('user123');
    });
  });

  describe('Rooms & IDOR', () => {
    it('4 & 6. Usuario que no participa (externo) -> rechazado al intentar entrar al room', async () => {
      const mockClient = { data: { user: { sub: 'hacker' } }, join: jest.fn() } as any;
      mockChatService.getConversationById.mockRejectedValue(new Error('Forbidden'));
      
      const res = await gateway.handleJoinRoom(mockClient, 'conv-1');
      expect(res?.event).toBe('error');
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it('5. Usuario autorizado entra únicamente al room de su Conversation', async () => {
      const mockClient = { data: { user: { sub: 'client1' } }, join: jest.fn() } as any;
      mockChatService.getConversationById.mockResolvedValue({ id: 'conv-1' });
      
      const res = await gateway.handleJoinRoom(mockClient, 'conv-1');
      expect(res?.event).toBe('joinedRoom');
      expect(mockClient.join).toHaveBeenCalledWith('conversation:conv-1');
    });
  });

  describe('Messages Emission & Persistence', () => {
    it('7 & 8. Persistencia ocurre antes de emitir message:new', async () => {
      const mockClient = { data: { user: { sub: 'client1' } } } as any;
      const payload = { conversationId: 'conv-1', content: 'hello' };
      
      const persistedMessage = { id: 'msg-1', content: 'hello', senderId: 'client1', conversationId: 'conv-1', createdAt: new Date() };
      mockChatService.sendMessage.mockResolvedValue(persistedMessage);

      const res = await gateway.handleMessage(mockClient, payload);

      // Verify persistence was called
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('client1', 'conv-1', 'hello');
      
      // Verify emission happened AFTER persistence (and used the exact persisted entity)
      expect(mockServer.to).toHaveBeenCalledWith('conversation:conv-1');
      expect(mockServer.emit).toHaveBeenCalledWith('message:new', persistedMessage);
      
      // Verify response
      expect(res?.event).toBe('message:sent');
    });

    it('9. El evento message:new contiene la información necesaria (mock object)', async () => {
      const mockClient = { data: { user: { sub: 'client1' } } } as any;
      const payload = { conversationId: 'conv-1', content: 'hello' };
      
      const persistedMessage = { id: 'msg-1', content: 'hello', senderId: 'client1' };
      mockChatService.sendMessage.mockResolvedValue(persistedMessage);

      await gateway.handleMessage(mockClient, payload);
      expect(mockServer.emit).toHaveBeenCalledWith('message:new', expect.objectContaining({ senderId: 'client1' }));
    });
  });
});

