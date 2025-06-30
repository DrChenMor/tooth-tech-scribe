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

// 🔥 ENHANCED: Helper function to properly format font values
const formatFontValue = (value: string): string => {
  if (!value) return value;
  
  // Handle font stacks with commas
  const fonts = value.split(',').map(f => f.trim());
  const processedFonts = fonts.map(font => {
    // Remove existing quotes
    font = font.replace(/["']/g, '');
    // If font name has spaces and isn't already quoted, quote it
    if (font.includes(' ') && 
        !font.includes('sans-serif') && 
        !font.includes('serif') && 
        !font.includes('monospace') &&
        !font.includes('cursive') &&
        !font.includes('fantasy')) {
      return `"${font}"`;
    }
    return font;
  });
  
  return processedFonts.join(', ');
};

// 🔥 NUCLEAR: Force font application to all elements
const forceApplyFontsToAllElements = (theme: Theme) => {
  if (theme['--font-secondary']) {
    const headingFont = formatFontValue(theme['--font-secondary']);
    console.log('🎯 Force applying heading font:', headingFont);
    
    // Apply to all headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading) => {
      (heading as HTMLElement).style.fontFamily = headingFont;
      (heading as HTMLElement).style.setProperty('font-family', headingFont, 'important');
    });
    
    // Apply to elements with heading-like classes
    const headingLikes = document.querySelectorAll('.text-4xl, .text-5xl, .text-6xl, .text-3xl, .text-2xl, .text-xl, .font-bold, .font-semibold');
    headingLikes.forEach((element) => {
      (element as HTMLElement).style.fontFamily = headingFont;
      (element as HTMLElement).style.setProperty('font-family', headingFont, 'important');
    });
    
    console.log(`✅ Applied heading font to ${headings.length} headings and ${headingLikes.length} heading-like elements`);
  }
  
  if (theme['--font-main']) {
    const bodyFont = formatFontValue(theme['--font-main']);
    console.log('🎯 Force applying body font:', bodyFont);
    
    // Apply to body and common elements
    document.body.style.fontFamily = bodyFont;
    document.body.style.setProperty('font-family', bodyFont, 'important');
    
    const bodyElements = document.querySelectorAll('p, span, div:not(:has(h1, h2, h3, h4, h5, h6))');
    bodyElements.forEach((element) => {
      (element as HTMLElement).style.fontFamily = bodyFont;
    });
    
    console.log(`✅ Applied body font to body + ${bodyElements.length} elements`);
  }
};

// 🔥 ENHANCED: Helper function to apply theme with aggressive font handling
const applyThemeToDocument = (theme: Theme) => {
  Object.entries(theme).forEach(([key, value]) => {
    if (value) {
      let finalValue = value;
      
      // 🔥 IMPROVED: Special handling for font properties
      if (key.includes('font')) {
        finalValue = formatFontValue(value);
        console.log(`✅ Applied ${key}: ${finalValue}`);
      }
      
      try {
        document.documentElement.style.setProperty(key, finalValue);
      } catch (error) {
        console.warn(`⚠️ Failed to apply ${key}: ${finalValue}`, error);
      }
    }
  });
  
  // 🔥 CRITICAL: Force apply fonts to all elements immediately
  setTimeout(() => {
    forceApplyFontsToAllElements(theme);
  }, 10);
  
  // 🔥 NUCLEAR: Force browser to recalculate styles for fonts
  const hasFontChanges = ['--font-main', '--font-secondary'].some(key => theme[key as keyof Theme]);
  
  if (hasFontChanges) {
    // Method 1: Force reflow
    const originalDisplay = document.body.style.display;
    document.body.style.display = 'none';
    document.body.offsetHeight; // Force reflow
    document.body.style.display = originalDisplay || '';
    
    // Method 2: Add/remove class to trigger recalculation
    document.documentElement.classList.add('theme-updating');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-updating');
    }, 100);
    
    // Method 3: Inject temporary CSS to force refresh
    const tempStyle = document.createElement('style');
    tempStyle.id = 'temp-font-refresh';
    tempStyle.textContent = `
      h1, h2, h3, h4, h5, h6 { 
        font-family: var(--font-secondary) !important; 
      }
      body, p, span, div {
        font-family: var(--font-main) !important;
      }
      * {
        font-family: inherit !important;
      }
    `;
    document.head.appendChild(tempStyle);
    
    setTimeout(() => {
      const existingStyle = document.getElementById('temp-font-refresh');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    }, 200);
    
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
          
          // 🔥 IMPROVED: Apply theme using the enhanced function
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

    // 🔥 NEW: Listen for DOM changes to reapply fonts to new elements
    const handleDOMChanges = () => {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        try {
          const theme: Theme = JSON.parse(savedTheme);
          setTimeout(() => forceApplyFontsToAllElements(theme), 100);
        } catch (error) {
          console.warn('Failed to reapply fonts on DOM change:', error);
        }
      }
    };

    // Set up observers for dynamic content
    const observer = new MutationObserver((mutations) => {
      let shouldReapplyFonts = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain headings or text elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.matches('h1, h2, h3, h4, h5, h6, p, span, div') ||
                  element.querySelector('h1, h2, h3, h4, h5, h6, p, span, div')) {
                shouldReapplyFonts = true;
              }
            }
          });
        }
      });
      
      if (shouldReapplyFonts) {
        handleDOMChanges();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleCustomThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleCustomThemeChange as EventListener);
      observer.disconnect();
    };
  }, []);
};

// 🔥 ENHANCED: Helper function to trigger theme change events
export const triggerThemeChange = (theme: Theme) => {
  // Apply theme immediately
  applyThemeToDocument(theme);
  
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