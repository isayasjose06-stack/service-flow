// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationBell } from './NotificationBell';
import axios from 'axios';

vi.mock('axios');

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the bell and fetch unread count on mount', async () => {
    (axios.get as any).mockResolvedValueOnce({ data: { count: 3 } });
    render(<NotificationBell />);
    
    await waitFor(() => {
      expect(screen.getByTestId('unread-badge')).toBeTruthy();
    });
    expect(axios.get).toHaveBeenCalledWith('/api/notifications/unread-count');
  });

  it('should open dropdown and fetch notifications when clicked', async () => {
    (axios.get as any)
      .mockResolvedValueOnce({ data: { count: 1 } })
      .mockResolvedValueOnce({ 
        data: { data: [ { id: '1', title: 'Test Notif', body: 'Body', readAt: null } ] } 
      });
    
    render(<NotificationBell />);
    
    fireEvent.click(screen.getByTestId('notification-bell'));
    
    expect(screen.getByTestId('loading-state')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByTestId('notification-list')).toBeTruthy();
      expect(screen.getByText('Test Notif')).toBeTruthy();
    });
  });

  it('should mark all as read', async () => {
    (axios.get as any)
      .mockResolvedValueOnce({ data: { count: 1 } })
      .mockResolvedValueOnce({ 
        data: { data: [ { id: '1', title: 'Test Notif', body: 'Body', readAt: null } ] } 
      });
    (axios.patch as any).mockResolvedValueOnce({ data: { success: true } });

    render(<NotificationBell />);
    
    fireEvent.click(screen.getByTestId('notification-bell'));
    
    await waitFor(() => {
      expect(screen.getByTestId('mark-all-read')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('mark-all-read'));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('/api/notifications/read-all');
    });
  });

  it('should render empty state when no notifications', async () => {
    (axios.get as any)
      .mockResolvedValueOnce({ data: { count: 0 } })
      .mockResolvedValueOnce({ data: { data: [] } });

    render(<NotificationBell />);
    
    fireEvent.click(screen.getByTestId('notification-bell'));
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeTruthy();
    });
  });

  it('should render error state if fetch fails', async () => {
    (axios.get as any)
      .mockResolvedValueOnce({ data: { count: 0 } })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<NotificationBell />);
    
    fireEvent.click(screen.getByTestId('notification-bell'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeTruthy();
    });
  });
});
