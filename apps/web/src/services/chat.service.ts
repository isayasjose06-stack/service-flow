import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = '/api';

export const ChatManager = {
  getConversation: async (serviceId: string) => {
    const res = await axios.get(`${API_URL}/services/${serviceId}/conversation`);
    return res.data;
  },

  getMessages: async (conversationId: string, limit: number = 50, cursor?: string) => {
    let url = `${API_URL}/conversations/${conversationId}/messages?limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    const res = await axios.get(url);
    return res.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const res = await axios.post(`${API_URL}/conversations/${conversationId}/messages`, { content });
    return res.data;
  },

  markAsRead: async (conversationId: string) => {
    const res = await axios.post(`${API_URL}/conversations/${conversationId}/read`);
    return res.data;
  },

  getUnreadCount: async (conversationId: string) => {
    const res = await axios.get(`${API_URL}/conversations/${conversationId}/unread-count`);
    return res.data;
  },

  connectSocket: (conversationId: string, token: string, onMessage: (msg: any) => void): Socket => {
    const socket = io('http://localhost:3000/chat', { // using localhost 3000 where api is running, or standard host
      query: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('joinRoom', { conversationId });
    });

    socket.on('message:new', onMessage);

    return socket;
  }
};
