'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ChatManager } from '@/services/chat.service';

interface ChatBoxProps {
  serviceId: string;
  currentUserId: string;
  token?: string; // JWT token for socket auth
}

export function ChatBox({ serviceId, currentUserId, token }: ChatBoxProps) {
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Load conversation
    ChatManager.getConversation(serviceId)
      .then(conv => {
        setConversation(conv);
        return ChatManager.getMessages(conv.id);
      })
      .then(msgs => {
        setMessages(msgs.reverse()); // Because they come descending
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [serviceId]);

  useEffect(() => {
    if (conversation && token) {
      // 2. Connect to socket
      const s = ChatManager.connectSocket(conversation.id, token, (msg: any) => {
        setMessages(prev => {
          // prevent duplicate
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        
        // Mark as read if receiving from other
        if (msg.senderId !== currentUserId) {
          ChatManager.markAsRead(conversation.id).catch(console.error);
        }
      });
      setSocket(s);
      
      // Mark initial unread as read
      ChatManager.markAsRead(conversation.id).catch(console.error);

      return () => {
        s.disconnect();
      };
    }
  }, [conversation, token, currentUserId]);

  useEffect(() => {
    // Auto-scroll
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      const msg = await ChatManager.sendMessage(conversation.id, newMessage);
      setNewMessage('');
      // If we rely on socket emit to receive our own message, that's fine.
      // But socket.io might broadcast to others, or to all in room. 
      // Let's add it locally if it's not duplicated:
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch (err) {
      console.error(err);
      alert('Error enviando mensaje');
    }
  };

  if (loading) return <div>Cargando chat...</div>;
  if (!conversation) return <div>Error al cargar chat</div>;

  return (
    <div className="flex flex-col h-[500px] border rounded bg-white shadow-sm">
      <div className="p-4 bg-primary-600 text-white font-bold flex justify-between">
        <span>Chat del Servicio</span>
        <span className="text-xs font-normal">Conectado</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2 rounded-lg max-w-[75%] ${isMine ? 'bg-primary-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()} {msg.isRead && isMine ? '✓✓' : ''}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="flex-1 border p-2 rounded focus:outline-none focus:border-primary-500"
          placeholder="Escribe un mensaje..."
          maxLength={2000}
        />
        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded font-bold hover:bg-primary-700">
          Enviar
        </button>
      </form>
    </div>
  );
}
