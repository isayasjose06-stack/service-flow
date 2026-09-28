'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (e) {
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await axios.get('/api/notifications?page=1&limit=20');
      setNotifications(res.data.data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.patch('/api/notifications/' + id + '/read');
      setNotifications(notifications.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (e) {}
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={toggleDropdown} data-testid="notification-bell">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500" data-testid="unread-badge" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border shadow-lg rounded-md z-50 p-4" data-testid="notification-dropdown">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:underline" data-testid="mark-all-read">
                Marcar todas como leidas
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-4" data-testid="loading-state">Cargando...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500" data-testid="error-state">Error cargando notificaciones</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-gray-500" data-testid="empty-state">No tienes notificaciones</div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2" data-testid="notification-list">
              {notifications.map((n) => (
                <div key={n.id} className={'p-2 rounded border ' + (!n.readAt ? 'bg-blue-50' : 'bg-gray-50')} data-testid={'notification-item-' + n.id}>
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm text-gray-600">{n.body}</div>
                  {!n.readAt && (
                    <button 
                      onClick={() => markAsRead(n.id)} 
                      className="text-xs text-blue-500 mt-1"
                      data-testid={'mark-read-' + n.id}
                    >
                      Marcar leida
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
