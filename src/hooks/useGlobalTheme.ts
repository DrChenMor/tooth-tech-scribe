// Updated src/hooks/useGlobalTheme.ts

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

// 🔥 NEW: Helper function to properly format font values
const formatFontValue = (value: string): string => {
  if (!value) return value;
  
  // Handle font stacks with commas
  const fonts = value.split(',').map(f => f.trim());
  const processedFonts = fonts.map(font => {
    // If font name has spaces and isn't already quoted, quote it
    if (font.includes(' ') && !font.includes('"') && !font.includes("'")) {
      return `"${font}"`;
    }
    return font;
  });
  
  return processedFonts.join(', ');
};

// 🔥 NEW: Helper function to apply theme with proper error handling
const applyThemeToDocument = (theme: Theme) => {
  Object.entries(theme).forEach(([key, value]) => {
    if (value) {
      let finalValue = value;
      
      // 🔥 IMPROVED: Special handling for font properties
      if (key.includes('font')) {
        finalValue = formatFontValue(value);
      }
      
      try {
        document.documentElement.style.setProperty(key, finalValue);
        console.log(`✅ Applied ${key}: ${finalValue}`);
      } catch (error) {
        console.warn(`⚠️ Failed to apply ${key}: ${finalValue}`, error);
      }
    }
  });
  
  // 🔥 NEW: Force browser to recalculate styles for fonts
  const fontKeys = ['--font-main', '--font-secondary'];
  const hasFontChanges = fontKeys.some(key => theme[key as keyof Theme]);
  
  if (hasFontChanges) {
    // Force style recalculation by temporarily hiding/showing body
    const originalDisplay = document.body.style.display;
    document.body.style.display = 'none';
    document.body.offsetHeight; // Force reflow
    document.body.style.display = originalDisplay || '';
    
    console.log('🔄 Forced font style recalculation');
  }
};

export const useGlobalTheme = () => {
  useEffect(() => {
    // Load and apply theme on every page load
    const loadAndApplyTheme = () => {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        try {
          const theme: Theme = JSON.parse(savedTheme);
          
          console.log('🎨 Loading saved theme:', theme);
          
          // 🔥 IMPROVED: Apply theme using the new helper function
          applyThemeToDocument(theme);
          
          console.log('✅ Global theme applied successfully');
        } catch (error) {
          console.error('❌ Failed to parse saved theme:', error);
          localStorage.removeItem('app-theme'); // Remove corrupted theme
        }
      } else {
        console.log('🎨 No saved theme found, using CSS defaults');
      }
    };

    // Apply theme immediately
    loadAndApplyTheme();

    // 🔥 IMPROVED: Listen for theme changes from other tabs/windows AND same page
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-theme') {
        console.log('🔄 Theme change detected from storage event');
        loadAndApplyTheme();
      }
    };

    // 🔥 NEW: Listen for custom theme change events (for same-page updates)
    const handleCustomThemeChange = (e: CustomEvent) => {
      if (e.detail && e.detail.theme) {
        console.log('🔄 Theme change detected from custom event');
        applyThemeToDocument(e.detail.theme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleCustomThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleCustomThemeChange as EventListener);
    };
  }, []);
};

// 🔥 NEW: Helper function to trigger theme change events
export const triggerThemeChange = (theme: Theme) => {
  // Dispatch custom event for same-page components
  window.dispatchEvent(new CustomEvent('themeChange', {
    detail: { theme }
  }));
  
  // Also trigger storage event for cross-tab communication
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'app-theme',
    newValue: JSON.stringify(theme),
    oldValue: localStorage.getItem('app-theme'),
    storageArea: localStorage,
    url: window.location.href
  }));
};