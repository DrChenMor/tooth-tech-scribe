// 🔧 FIXED: src/services/globalTheme.ts

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

// 🔥 FIX 1: Use correct table name consistently
const GLOBAL_THEME_TABLE = 'global_theme_settings'; // Or 'global_theme' - pick ONE

// 🔥 FIX 2: Add proper error handling
export const fetchActiveGlobalTheme = async (): Promise<GlobalTheme | null> => {
  try {
    console.log('🎨 Fetching active global theme...');
    
    const { data, error } = await supabase
      .from(GLOBAL_THEME_TABLE)
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error fetching active global theme:', error);
      return null;
    }

    if (data) {
      console.log('✅ Found active global theme:', data.theme_name);
      return {
        ...data,
        theme_data: data.theme_data as Record<string, string>
      };
    }

    console.log('⚠️ No active global theme found');
    return null;
  } catch (error) {
    console.error('💥 Failed to fetch active global theme:', error);
    return null;
  }
};

// 🔥 FIX 3: Correct updateSiteSetting function with proper parameter handling
export const updateSiteSetting = async (
  key: string, 
  value: any, 
  settingType: string = 'object'
): Promise<boolean> => {
  try {
    console.log('🔧 Updating site setting:', key);
    
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        setting_type: settingType, // 🔥 FIX: Add missing parameter
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Error updating site setting:', error);
      return false;
    }

    console.log('✅ Site setting updated successfully');
    return true;
  } catch (error) {
    console.error('💥 Failed to update site setting:', error);
    return false;
  }
};

// 🔥 FIX 4: Better user override checking
export const canUserOverrideTheme = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking if user can override theme...');
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'theme_enforcement')
      .single();

    if (error) {
      console.warn('⚠️ Error checking theme override permission, defaulting to allow:', error);
      return true; // Default to allowing override
    }

    const settingValue = data?.setting_value as any;
    const canOverride = settingValue?.allow_user_override !== false;
    
    console.log('✅ User override permission:', canOverride);
    return canOverride;
  } catch (error) {
    console.warn('⚠️ Failed to check theme override permission, defaulting to allow:', error);
    return true; // Default to allowing override
  }
};

// 🔥 FIX 5: Better saveGlobalTheme function
export const saveGlobalTheme = async (
  themeName: string, 
  themeData: Record<string, string>
): Promise<GlobalTheme | null> => {
  try {
    console.log('💾 Saving global theme:', themeName);
    
    const { data, error } = await supabase
      .from(GLOBAL_THEME_TABLE)
      .insert({
        theme_name: themeName,
        theme_data: themeData,
        is_active: false, // New themes are inactive by default
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving global theme:', error);
      throw new Error(`Failed to save theme: ${error.message}`);
    }

    console.log('✅ Global theme saved successfully:', data.id);
    return data ? {
      ...data,
      theme_data: data.theme_data as Record<string, string>
    } : null;
  } catch (error) {
    console.error('💥 Failed to save global theme:', error);
    throw error;
  }
};

// 🔥 FIX 6: Better activateGlobalTheme function
export const activateGlobalTheme = async (themeId: string): Promise<boolean> => {
  try {
    console.log('🎯 Activating global theme:', themeId);
    
    // Step 1: Deactivate all themes
    const { error: deactivateError } = await supabase
      .from(GLOBAL_THEME_TABLE)
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('❌ Error deactivating themes:', deactivateError);
      return false;
    }

    // Step 2: Activate the selected theme
    const { error: activateError } = await supabase
      .from(GLOBAL_THEME_TABLE)
      .update({ is_active: true })
      .eq('id', themeId);

    if (activateError) {
      console.error('❌ Error activating theme:', activateError);
      return false;
    }

    console.log('✅ Global theme activated successfully');
    return true;
  } catch (error) {
    console.error('💥 Failed to activate global theme:', error);
    return false;
  }
};

// 🔥 FIX 7: Better real-time subscription management
class GlobalThemeSubscriptionManager {
  private static instance: GlobalThemeSubscriptionManager;
  private subscription: any = null;
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
    console.log('🔔 Adding theme subscription callback');
    this.callbacks.add(callback);

    if (!this.isSubscribed) {
      this.createSubscription();
    }

    return () => {
      console.log('🔕 Removing theme subscription callback');
      this.callbacks.delete(callback);
      
      if (this.callbacks.size === 0) {
        this.cleanup();
      }
    };
  }

  private createSubscription() {
    if (this.isSubscribed) return;

    console.log('🎧 Creating real-time theme subscription...');
    
    this.subscription = supabase
      .channel('global-theme-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: GLOBAL_THEME_TABLE, // 🔥 FIX: Use consistent table name
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
          this.callbacks.forEach(callback => {
            try {
              callback(theme);
            } catch (error) {
              console.error('❌ Error in theme subscription callback:', error);
            }
          });
        }
      )
      .subscribe();

    this.isSubscribed = true;
    console.log('✅ Global theme subscription created');
  }

  private cleanup() {
    if (this.subscription) {
      console.log('🧹 Cleaning up theme subscription...');
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.isSubscribed = false;
  }
}

// Export the subscription function
export const subscribeToGlobalThemeChanges = (callback: (theme: GlobalTheme | null) => void) => {
  const manager = GlobalThemeSubscriptionManager.getInstance();
  return manager.subscribe(callback);
};

// 🔥 FIX 8: Export all other functions
export const fetchAllGlobalThemes = async (): Promise<GlobalTheme[]> => {
  try {
    console.log('📋 Fetching all global themes...');
    
    const { data, error } = await supabase
      .from(GLOBAL_THEME_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching all global themes:', error);
      return [];
    }

    console.log('✅ Found', data?.length || 0, 'global themes');
    return (data || []).map(theme => ({
      ...theme,
      theme_data: theme.theme_data as Record<string, string>
    }));
  } catch (error) {
    console.error('💥 Failed to fetch all global themes:', error);
    return [];
  }
};

export const fetchSiteSetting = async (key: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('setting_key', key)
      .single();

    if (error) {
      console.error('❌ Error fetching site setting:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('💥 Failed to fetch site setting:', error);
    return null;
  }
};