import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromHeader(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload; // Attach user to socket
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Optional cleanup
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string
  ) {
    try {
      if (!client.data.user?.sub) return;
      // Authorize using service
      await this.chatService.getConversationById(client.data.user.sub, conversationId);
      
      const room = `conversation:${conversationId}`;
      client.join(room);
      return { event: 'joinedRoom', data: { conversationId } };
    } catch (error) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
  }

  @SubscribeMessage('message:send')
  @UsePipes(new ValidationPipe())
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string }
  ) {
    try {
      const userId = client.data.user?.sub;
      if (!userId) return;
      
      // Order: validate & authorize inside service, persist, then emit.
      const message = await this.chatService.sendMessage(userId, payload.conversationId, payload.content);

      // Emit to room
      this.server.to(`conversation:${payload.conversationId}`).emit('message:new', message);

      return { event: 'message:sent', data: message };
    } catch (error) {
      return { event: 'error', data: { message: 'Failed to send message' } };
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }
    // Try from query if needed (e.g. ?token=...)
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }
    return undefined;
  }
}
