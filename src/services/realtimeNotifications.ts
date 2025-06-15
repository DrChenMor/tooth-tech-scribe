
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationSubscription {
  unsubscribe: () => void;
}

class RealtimeNotificationService {
  private notifications: Notification[] = [];
  private subscribers: Array<(notifications: Notification[]) => void> = [];
  private maxNotifications: number = 100;

  constructor() {
    this.setupRealtimeSubscriptions();
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    // Subscribe to AI suggestions changes
    supabase
      .channel('notifications-suggestions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions'
        },
        (payload) => {
          this.handleSuggestionChange(payload);
        }
      )
      .subscribe();

    // Subscribe to agent changes
    supabase
      .channel('notifications-agents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agents'
        },
        (payload) => {
          this.handleAgentChange(payload);
        }
      )
      .subscribe();
  }

  private handleSuggestionChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        this.addNotification({
          type: 'info',
          title: 'New AI Suggestion',
          message: `Agent generated a new suggestion for ${newRecord.target_type}`,
          metadata: { suggestionId: newRecord.id, agentId: newRecord.agent_id }
        });
        break;
      case 'UPDATE':
        if (oldRecord.status !== newRecord.status) {
          const statusColors = {
            approved: 'success' as const,
            rejected: 'warning' as const,
            implemented: 'success' as const
          };
          
          this.addNotification({
            type: statusColors[newRecord.status as keyof typeof statusColors] || 'info',
            title: 'Suggestion Status Updated',
            message: `Suggestion ${newRecord.status}`,
            metadata: { suggestionId: newRecord.id }
          });
        }
        break;
    }
  }

  private handleAgentChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        this.addNotification({
          type: 'success',
          title: 'New Agent Created',
          message: `Agent "${newRecord.name}" has been created`,
          metadata: { agentId: newRecord.id }
        });
        break;
      case 'UPDATE':
        if (oldRecord.is_active !== newRecord.is_active) {
          this.addNotification({
            type: newRecord.is_active ? 'success' : 'warning',
            title: 'Agent Status Changed',
            message: `Agent "${newRecord.name}" is now ${newRecord.is_active ? 'active' : 'inactive'}`,
            metadata: { agentId: newRecord.id }
          });
        }
        break;
    }
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);

    // Limit notifications count
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.notifySubscribers();
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifySubscribers();
  }

  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifySubscribers();
  }

  clearAll(): void {
    this.notifications = [];
    this.notifySubscribers();
  }

  subscribe(callback: (notifications: Notification[]) => void): NotificationSubscription {
    this.subscribers.push(callback);
    
    // Send current notifications immediately
    callback([...this.notifications]);

    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback([...this.notifications]);
    });
  }

  // System notifications for performance alerts
  addPerformanceAlert(message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const typeMap = {
      low: 'info' as const,
      medium: 'warning' as const,
      high: 'warning' as const,
      critical: 'error' as const
    };

    this.addNotification({
      type: typeMap[severity],
      title: 'Performance Alert',
      message,
      actionUrl: '/admin/ai-copilot?tab=overview'
    });
  }

  addSystemNotification(title: string, message: string, type: Notification['type'] = 'info'): void {
    this.addNotification({
      type,
      title,
      message
    });
  }
}

export const notificationService = new RealtimeNotificationService();
