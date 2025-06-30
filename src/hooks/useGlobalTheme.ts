// 1. CREATE A NEW FILE: src/hooks/useGlobalTheme.ts

import { useEffect } from 'react';

interface Theme {
  '--primary': string;
  '--background': string;
  '--foreground': string;
  '--card': string;
  '--muted': string;
  '--border': string;
  '--font-main': string;
  '--font-secondary': string;
  '--radius': string;
  '--p-font-size': string;
  '--h1-font-size': string;
  '--h2-font-size': string;
  '--h3-font-size': string;
  '--h4-font-size': string;
  '--h5-font-size': string;
  '--h6-font-size': string;
}

export const useGlobalTheme = () => {
  useEffect(() => {
    // Load and apply theme on every page load
    const loadAndApplyTheme = () => {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        try {
          const theme: Theme = JSON.parse(savedTheme);
          
          // Apply each theme property to document root
          Object.entries(theme).forEach(([key, value]) => {
            if (value) {
              const finalValue = key.includes('font') && !value.includes("'") 
                ? `'${value}'` 
                : value;
              document.documentElement.style.setProperty(key, finalValue);
            }
          });
          
          console.log('✅ Global theme applied:', theme);
        } catch (error) {
          console.error('Failed to parse saved theme:', error);
        }
      }
    };

    // Apply theme immediately
    loadAndApplyTheme();

    // Listen for theme changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-theme') {
        loadAndApplyTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
};