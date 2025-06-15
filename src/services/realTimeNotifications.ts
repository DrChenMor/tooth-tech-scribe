import { supabase } from '@/integrations/supabase/client';

export interface SystemNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
  actionUrl?: string;
}

export class RealTimeNotificationService {
  private static instance: RealTimeNotificationService;
  private notifications: SystemNotification[] = [];
  private listeners: ((notifications: SystemNotification[]) => void)[] = [];

  static getInstance(): RealTimeNotificationService {
    if (!RealTimeNotificationService.instance) {
      RealTimeNotificationService.instance = new RealTimeNotificationService();
    }
    return RealTimeNotificationService.instance;
  }

  constructor() {
    this.initializeRealTimeListeners();
    this.checkSystemHealth();
  }

  private initializeRealTimeListeners() {
    // Listen for new AI suggestions
    supabase
      .channel('ai-suggestions-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_suggestions'
        },
        (payload) => {
          const suggestion = payload.new as any;
          this.addNotification({
            type: 'info',
            title: 'New AI Suggestion',
            message: `AI agent generated a new ${suggestion.target_type} suggestion`,
            actionable: true,
            actionUrl: '/admin/ai-copilot'
          });
        }
      )
      .subscribe();

    // Listen for article status changes
    supabase
      .channel('article-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'articles'
        },
        (payload) => {
          const article = payload.new as any;
          const oldArticle = payload.old as any;
          
          if (oldArticle.status !== article.status && article.status === 'published') {
            this.addNotification({
              type: 'success',
              title: 'Article Published',
              message: `"${article.title}" has been published successfully`,
              actionable: true,
              actionUrl: `/admin/articles/${article.id}`
            });
          }
        }
      )
      .subscribe();
  }

  private async checkSystemHealth() {
    try {
      // Check for articles with low engagement
      const { data: lowEngagementArticles } = await supabase
        .from('articles')
        .select('id, title, views, published_date')
        .eq('status', 'published')
        .lt('views', 50)
        .gte('published_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (lowEngagementArticles && lowEngagementArticles.length > 0) {
        this.addNotification({
          type: 'warning',
          title: 'Low Engagement Alert',
          message: `${lowEngagementArticles.length} recent articles have low engagement`,
          actionable: true,
          actionUrl: '/admin/articles'
        });
      }

      // Check for pending AI suggestions
      const { data: pendingSuggestions } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('status', 'pending');

      if (pendingSuggestions && pendingSuggestions.length > 5) {
        this.addNotification({
          type: 'info',
          title: 'Pending AI Suggestions',
          message: `${pendingSuggestions.length} AI suggestions are waiting for review`,
          actionable: true,
          actionUrl: '/admin/ai-copilot'
        });
      }

    } catch (error) {
      console.error('Health check failed:', error);
      this.addNotification({
        type: 'error',
        title: 'System Health Check Failed',
        message: 'Unable to perform routine system health check'
      });
    }
  }

  addNotification(notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: SystemNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();
  }

  getNotifications(): SystemNotification[] {
    return [...this.notifications];
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  clearNotifications() {
    this.notifications = [];
    this.notifyListeners();
  }

  subscribe(listener: (notifications: SystemNotification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

export const realTimeNotifications = RealTimeNotificationService.getInstance();
