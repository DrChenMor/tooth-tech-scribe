// src/hooks/useEnhancedGlobalTheme.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchActiveGlobalTheme, 
  canUserOverrideTheme, 
  subscribeToGlobalThemeChanges,
  type GlobalTheme
} from '../services/globalTheme';

interface Theme {
  '--primary': string;
  '--background': string;
  '--foreground': string;
  '--card': string;
  '--muted': string;
  '--border': string;
  '--radius': string;
  '--h1-font-family': string;
  '--h2-font-family': string;
  '--h3-font-family': string;
  '--p-font-family': string;
  '--h1-font-size': string;
  '--h2-font-size': string;
  '--h3-font-size': string;
  '--p-font-size': string;
  [key: string]: string;
}

const DEFAULT_THEME: Theme = {
  '--primary': '217 91% 34%',
  '--background': '0 0% 100%',
  '--foreground': '222.2 84% 4.9%',
  '--card': '0 0% 100%',
  '--muted': '210 40% 96.1%',
  '--border': '214.3 31.8% 91.4%',
  '--radius': '0.5rem',
  '--h1-font-family': 'Playfair Display, serif',
  '--h2-font-family': 'Playfair Display, serif',
  '--h3-font-family': 'Source Sans Pro, sans-serif',
  '--p-font-family': 'Source Sans Pro, sans-serif',
  '--h1-font-size': '2.5rem',
  '--h2-font-size': '2rem',
  '--h3-font-size': '1.5rem',
  '--p-font-size': '1rem',
};

export const useGlobalTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_THEME);
  const [themeSource, setThemeSource] = useState<'global' | 'user' | 'default'>('default');
  const [userCanOverride, setUserCanOverride] = useState(true);
  const [hasGlobalTheme, setHasGlobalTheme] = useState(false);
  const [globalTheme, setGlobalTheme] = useState<GlobalTheme | null>(null);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const isSubscribedRef = useRef(false);

  // 🔥 FETCH GLOBAL THEME
  const { data: activeGlobalTheme, isLoading: loadingGlobalTheme } = useQuery({
    queryKey: ['global-theme'],
    queryFn: fetchActiveGlobalTheme,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 🔥 CHECK USER OVERRIDE PERMISSION
  const { data: canOverride } = useQuery({
    queryKey: ['can-override-theme'],
    queryFn: canUserOverrideTheme,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // 🔥 APPLY THEME TO DOM
  const applyTheme = useCallback((theme: Theme) => {
    // Only apply theme on client side to avoid SSR issues
    if (typeof window === 'undefined') return;
    
    console.log('🎨 Applying theme:', theme);
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // 🔥 DETERMINE ACTIVE THEME
  useEffect(() => {
    // Skip on server side
    if (typeof window === 'undefined') return;
    
    const determineActiveTheme = () => {
      const hasGlobal =
        !!activeGlobalTheme &&
        typeof activeGlobalTheme === 'object' &&
        activeGlobalTheme !== null &&
        'theme_data' in activeGlobalTheme &&
        typeof activeGlobalTheme.theme_data === 'object' &&
        activeGlobalTheme.theme_data !== null &&
        Object.keys(activeGlobalTheme.theme_data).length > 0;
      const canOverrideTheme = canOverride !== false;

      console.log('🔍 Determining active theme...', {
        hasGlobalTheme: hasGlobal,
        canOverride: canOverrideTheme,
        userCanOverride: userCanOverride
      });

      if (hasGlobal && !canOverrideTheme) {
        // 🔥 GLOBAL THEME (user override disabled)
        console.log('✅ Using GLOBAL theme (user override disabled)');
        setThemeSource('global');
        setHasGlobalTheme(true);
        setGlobalTheme(activeGlobalTheme);
        setCurrentTheme(activeGlobalTheme.theme_data as Theme);
        applyTheme(activeGlobalTheme.theme_data as Theme);
      } else if (hasGlobal && canOverrideTheme) {
        // 🔥 GLOBAL THEME (user can override)
        console.log('✅ Using GLOBAL theme (user can override)');
        setThemeSource('global');
        setHasGlobalTheme(true);
        setGlobalTheme(activeGlobalTheme);
        setCurrentTheme(activeGlobalTheme.theme_data as Theme);
        applyTheme(activeGlobalTheme.theme_data as Theme);
      } else {
        // 🔥 DEFAULT THEME
        console.log('✅ Using DEFAULT theme');
        setThemeSource('default');
        setHasGlobalTheme(false);
        setGlobalTheme(null);
        setCurrentTheme(DEFAULT_THEME);
        applyTheme(DEFAULT_THEME);
      }
    };

    determineActiveTheme();
  }, [activeGlobalTheme, canOverride, userCanOverride, applyTheme]);

  // 🔥 SETUP REAL-TIME SUBSCRIPTION (with cleanup) - ONLY ONCE
  useEffect(() => {
    // Prevent multiple subscriptions
    if (isSubscribedRef.current) {
      return;
    }

    // Cleanup previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    // Setup new subscription
    const unsubscribe = subscribeToGlobalThemeChanges((updatedTheme) => {
      console.log('🔄 Global theme updated:', updatedTheme);
      if (updatedTheme && updatedTheme.is_active) {
        setGlobalTheme(updatedTheme);
        setCurrentTheme(updatedTheme.theme_data as Theme);
        applyTheme(updatedTheme.theme_data as Theme);
      }
    });

    subscriptionRef.current = unsubscribe;
    isSubscribedRef.current = true;

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

  // 🔥 SAVE USER THEME
  const saveUserTheme = useCallback((theme: Theme) => {
    // Only save on client side
    if (typeof window === 'undefined') return;
    
    const themeString = JSON.stringify(theme);
    localStorage.setItem('user-theme', themeString);
    setCurrentTheme(theme);
    setThemeSource('user');
    applyTheme(theme);
    console.log('💾 User theme saved:', theme);
  }, [applyTheme]);

  return {
    currentTheme,
    themeSource,
    userCanOverride: canOverride !== false,
    hasGlobalTheme,
    globalTheme,
    saveUserTheme,
    isLoading: loadingGlobalTheme,
  };
};