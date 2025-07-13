// src/services/globalTheme.ts
import { supabase } from '@/integrations/supabase/client';

export interface GlobalTheme {
  id: string;
  theme_name: string;
  theme_data: Record<string, string>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

// 🔥 SINGLETON SUBSCRIPTION MANAGER
class GlobalThemeSubscriptionManager {
  private static instance: GlobalThemeSubscriptionManager;
  private subscription: any = null; // RealtimeChannel type
  private callbacks: Set<(theme: GlobalTheme | null) => void> = new Set();
  private isSubscribed = false;

  private constructor() {}

  static getInstance(): GlobalThemeSubscriptionManager {
    if (!GlobalThemeSubscriptionManager.instance) {
      GlobalThemeSubscriptionManager.instance = new GlobalThemeSubscriptionManager();
    }
    return GlobalThemeSubscriptionManager.instance;
  }

  subscribe(callback: (theme: GlobalTheme | null) => void): () => void {
    this.callbacks.add(callback);

    // If not already subscribed, create the subscription
    if (!this.isSubscribed) {
      this.createSubscription();
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
      
      // If no more callbacks, cleanup subscription
      if (this.callbacks.size === 0) {
        this.cleanup();
      }
    };
  }

  private createSubscription() {
    if (this.isSubscribed) return;

    this.subscription = supabase
      .channel('global-theme-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_theme_settings',
        },
        (payload) => {
          console.log('🔄 Global theme change detected:', payload);
          
          let theme: GlobalTheme | null = null;
          
          if (payload.eventType === 'UPDATE' && payload.new?.is_active) {
            theme = {
              ...payload.new,
              theme_data: payload.new.theme_data as Record<string, string>
            } as GlobalTheme;
          } else if (payload.eventType === 'INSERT' && payload.new?.is_active) {
            theme = {
              ...payload.new,
              theme_data: payload.new.theme_data as Record<string, string>
            } as GlobalTheme;
          }

          // Notify all callbacks
          this.callbacks.forEach(callback => callback(theme));
        }
      )
      .subscribe();

    this.isSubscribed = true;
    console.log('✅ Global theme subscription created');
  }

  private cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.isSubscribed = false;
    console.log('🧹 Global theme subscription cleaned up');
  }
}

// 🔥 FETCH ACTIVE GLOBAL THEME
export const fetchActiveGlobalTheme = async (): Promise<GlobalTheme | null> => {
  try {
    const { data, error } = await supabase
      .from('global_theme_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching active global theme:', error);
      return null;
    }

    // Cast the data to our interface type
    return data ? {
      ...data,
      theme_data: data.theme_data as Record<string, string>
    } : null;
  } catch (error) {
    console.error('Failed to fetch active global theme:', error);
    return null;
  }
};

// 🔥 FETCH ALL GLOBAL THEMES
export const fetchAllGlobalThemes = async (): Promise<GlobalTheme[]> => {
  try {
    const { data, error } = await supabase
      .from('global_theme_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all global themes:', error);
      return [];
    }

    // Cast the data to our interface type
    return (data || []).map(theme => ({
      ...theme,
      theme_data: theme.theme_data as Record<string, string>
    }));
  } catch (error) {
    console.error('Failed to fetch all global themes:', error);
    return [];
  }
};

// 🔥 CHECK IF USER CAN OVERRIDE THEME
export const canUserOverrideTheme = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'theme_enforcement')
      .single();

    if (error) {
      console.error('Error checking theme override permission:', error);
      return true; // Default to allowing override
    }

    const settingValue = data?.setting_value as any;
    return settingValue?.allow_user_override !== false;
  } catch (error) {
    console.error('Failed to check theme override permission:', error);
    return true; // Default to allowing override
  }
};

// 🔥 SAVE GLOBAL THEME
export const saveGlobalTheme = async (themeName: string, themeData: Record<string, string>): Promise<GlobalTheme | null> => {
  try {
    const { data, error } = await supabase
      .from('global_theme_settings')
      .insert({
        theme_name: themeName,
        theme_data: themeData,
        is_active: false, // New themes are inactive by default
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving global theme:', error);
      return null;
    }

    // Cast the data to our interface type
    return data ? {
      ...data,
      theme_data: data.theme_data as Record<string, string>
    } : null;
  } catch (error) {
    console.error('Failed to save global theme:', error);
    return null;
  }
};

// 🔥 ACTIVATE GLOBAL THEME
export const activateGlobalTheme = async (themeId: string): Promise<boolean> => {
  try {
    // First, deactivate all themes
    const { error: deactivateError } = await supabase
      .from('global_theme_settings')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating themes:', deactivateError);
      return false;
    }

    // Then activate the selected theme
    const { error: activateError } = await supabase
      .from('global_theme_settings')
      .update({ is_active: true })
      .eq('id', themeId);

    if (activateError) {
      console.error('Error activating theme:', activateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to activate global theme:', error);
    return false;
  }
};

// 🔥 UPDATE SITE SETTING
export const updateSiteSetting = async (key: string, value: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        setting_type: typeof value,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating site setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update site setting:', error);
    return false;
  }
};

// 🔥 FETCH SITE SETTING
export const fetchSiteSetting = async (key: string): Promise<SiteSetting | null> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('setting_key', key)
      .single();

    if (error) {
      console.error('Error fetching site setting:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch site setting:', error);
    return null;
  }
};

// 🔥 SUBSCRIBE TO GLOBAL THEME CHANGES (SINGLETON)
export const subscribeToGlobalThemeChanges = (callback: (theme: GlobalTheme | null) => void) => {
  const manager = GlobalThemeSubscriptionManager.getInstance();
  return manager.subscribe(callback);
}; 