import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, CheckCircle, AlertCircle, Palette, Type, Network, Globe, List, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  saveGlobalTheme, 
  fetchAllGlobalThemes, 
  activateGlobalTheme,
  updateSiteSetting,
  fetchSiteSetting
} from '@/services/globalTheme';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

interface ApiKeyStatus {
  name: string;
  displayName: string;
  configured: boolean;
  description: string;
}

interface SystemConfig {
  defaultCategory: string;
  defaultAuthor: string;
}

// Raw database interface to avoid TypeScript errors
interface SystemConfigRow {
  id: number;
  default_category: string;
  default_author: string;
  created_at?: string;
  updated_at?: string;
}

type Theme = {
  '--primary': string;
  '--background': string;
  '--foreground': string;
  '--card': string;
  '--muted': string;
  '--border': string;
  '--radius': string;

  // 🔥 NEW: Individual Font Control for Each Element
  '--h1-font-family': string;
  '--h2-font-family': string;
  '--h3-font-family': string;
  '--h4-font-family': string;
  '--h5-font-family': string;
  '--h6-font-family': string;
  '--p-font-family': string;
  '--body-font-family': string;
  '--button-font-family': string;
  '--input-font-family': string;
  '--nav-font-family': string;
  '--card-title-font-family': string;

  // Font Sizes
  '--h1-font-size': string;
  '--h2-font-size': string;
  '--h3-font-size': string;
  '--h4-font-size': string;
  '--h5-font-size': string;
  '--h6-font-size': string;
  '--p-font-size': string;
  '--small-font-size': string;
  '--large-font-size': string;

  // Font Weights
  '--h1-font-weight': string;
  '--h2-font-weight': string;
  '--h3-font-weight': string;
  '--h4-font-weight': string;
  '--h5-font-weight': string;
  '--h6-font-weight': string;
  '--p-font-weight': string;
  '--button-font-weight': string;
  '--nav-font-weight': string;
};

// Define the initialTheme object with all required properties
const initialTheme: Theme = {
  '--primary': '217 91% 34%',
  '--background': '210 20% 98%',
  '--foreground': '224 71% 4%',
  '--card': '0 0% 100%',
  '--muted': '210 40% 96.1%',
  '--border': '214.3 31.8% 91.4%',
  '--radius': '0.5rem',

  '--h1-font-family': 'Playfair Display, serif',
  '--h2-font-family': 'Playfair Display, serif',
  '--h3-font-family': 'Source Sans Pro, sans-serif',
  '--h4-font-family': 'Playfair Display, serif',
  '--h5-font-family': 'Source Sans Pro, sans-serif',
  '--h6-font-family': 'Source Sans Pro, sans-serif',
  '--p-font-family': 'Source Sans Pro, sans-serif',
  '--body-font-family': 'Source Sans Pro, sans-serif',
  '--button-font-family': 'Source Sans Pro, sans-serif',
  '--input-font-family': 'Source Sans Pro, sans-serif',
  '--nav-font-family': 'Source Sans Pro, sans-serif',
  '--card-title-font-family': 'Playfair Display, serif',

  '--h1-font-size': '2.5rem',
  '--h2-font-size': '2rem',
  '--h3-font-size': '1.5rem',
  '--h4-font-size': '1.5rem',
  '--h5-font-size': '1.125rem',
  '--h6-font-size': '1rem',
  '--p-font-size': '1rem',
  '--small-font-size': '0.875rem',
  '--large-font-size': '1.125rem',

  '--h1-font-weight': '700',
  '--h2-font-weight': '500',
  '--h3-font-weight': '500',
  '--h4-font-weight': '500',
  '--h5-font-weight': '400',
  '--h6-font-weight': '400',
  '--p-font-weight': '200',
  '--button-font-weight': '400',
  '--nav-font-weight': '700',
};


// Use any type to avoid TypeScript errors
const fetchSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const { data, error } = await (supabase as any)
      .from('system_config')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching system config:', error);
      return {
        defaultCategory: 'AI Generated',
        defaultAuthor: 'AI Content Generator'
      };
    }

    if (!data) {
      return {
        defaultCategory: 'AI Generated',
        defaultAuthor: 'AI Content Generator'
      };
    }

    return {
      defaultCategory: data.default_category || 'AI Generated',
      defaultAuthor: data.default_author || 'AI Content Generator'
    };
  } catch (error) {
    console.error('Failed to fetch system config:', error);
    return {
      defaultCategory: 'AI Generated',
      defaultAuthor: 'AI Content Generator'
    };
  }
};

const saveSystemConfig = async (config: SystemConfig) => {
  try {
    const { error } = await (supabase as any)
      .from('system_config')
      .upsert({
        id: 1,
        default_category: config.defaultCategory,
        default_author: config.defaultAuthor,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to save system configuration: ${error.message}`);
    }
  } catch (error) {
    console.error('Error saving system config:', error);
    throw error;
  }
};

const AdminSettingsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // 🔥 NEW: Global theme state
  const [themeName, setThemeName] = useState('Default Theme');
  const [saveAsGlobal, setSaveAsGlobal] = useState(false);
  const [allowUserOverride, setAllowUserOverride] = useState(true);
  
  // 🔥 NEW: Use enhanced global theme hook
  const { 
    currentTheme, 
    themeSource, 
    userCanOverride, 
    hasGlobalTheme,
    globalTheme,
    saveUserTheme 
  } = useGlobalTheme();

  // 🔥 NEW: Fetch all global themes
  const { data: allGlobalThemes, isLoading: loadingThemes } = useQuery({
    queryKey: ['all-global-themes'],
    queryFn: fetchAllGlobalThemes,
  });

  // 🔥 NEW: Fetch theme enforcement setting
  const { data: themeEnforcement } = useQuery({
    queryKey: ['theme-enforcement'],
    queryFn: () => fetchSiteSetting('theme_enforcement'),
  });

  // 🔥 NEW: Load theme enforcement setting
  useEffect(() => {
    if (themeEnforcement) {
      setAllowUserOverride(themeEnforcement.allow_user_override !== false);
    }
  }, [themeEnforcement]);

  const [apiKeys, setApiKeys] = useState({
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GOOGLE_API_KEY: ''
  });

  const [keyStatuses] = useState<ApiKeyStatus[]>([
    {
      name: 'OPENAI_API_KEY',
      displayName: 'OpenAI API Key',
      configured: true,
      description: 'Required for GPT-4 content generation'
    },
    {
      name: 'ANTHROPIC_API_KEY',
      displayName: 'Anthropic API Key',
      configured: false,
      description: 'Required for Claude content generation'
    },
    {
      name: 'GOOGLE_API_KEY',
      displayName: 'Google API Key',
      configured: true,
      description: 'Required for Gemini content generation'
    }
  ]);

  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    defaultCategory: 'AI Generated',
    defaultAuthor: 'AI Content Generator'
  });

  // Fetch system configuration with error handling
  const { data: configData, isLoading: isLoadingConfig, error: configError } = useQuery({
    queryKey: ['system-config'],
    queryFn: fetchSystemConfig,
    retry: 3,
    retryDelay: 1000,
  });

  // Update local state when config data loads
  useEffect(() => {
    if (configData) {
      setSystemConfig(configData);
      console.log('✅ System config loaded:', configData);
    }
  }, [configData]);

  // Show error if config failed to load
  useEffect(() => {
    if (configError) {
      console.error('❌ Failed to load system config:', configError);
      toast({
        title: "Configuration Warning",
        description: "Could not load system configuration. Using defaults.",
        variant: "destructive",
      });
    }
  }, [configError]);

  // Load theme from localStorage
  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const getDefaultTheme = (): Theme => {
      const defaultTheme = { ...initialTheme };
      (Object.keys(defaultTheme) as Array<keyof Theme>).forEach(key => {
        const value = rootStyle.getPropertyValue(key).trim();
        defaultTheme[key] = value.includes('"') ? value.replace(/"/g, '') : value;
      });
      return defaultTheme;
    };

    const savedTheme = localStorage.getItem('app-theme');
    const defaultTheme = getDefaultTheme();

    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setTheme({ ...defaultTheme, ...parsedTheme });
      } catch (error) {
        console.error("Failed to parse theme from localStorage", error);
        setTheme(defaultTheme);
      }
    } else {
      setTheme(defaultTheme);
    }
  }, []);

  // Apply theme changes live
  useEffect(() => {
    Object.entries(theme).forEach(([key, value]) => {
      if (value) {
        const finalValue = key.includes('font') && !value.includes("'") ? `'${value}'` : value;
        document.documentElement.style.setProperty(key, finalValue);
      }
    });
  }, [theme]);
  
  const handleThemeChange = (key: keyof Theme, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };
  
  // 🔥 NUCLEAR OPTION: Enhanced saveTheme function with aggressive font application
  const saveTheme = () => {
    if (saveAsGlobal) {
      saveThemeGlobally();
    } else {
      // Save locally (user theme)
      const success = saveUserTheme(theme);
      if (success) {
        toast({
          title: "💾 User Theme Saved",
          description: "Theme saved locally for this user only.",
        });
      } else {
        toast({
          title: "❌ Theme Override Disabled",
          description: "User theme override is currently disabled by admin.",
          variant: "destructive",
        });
      }
    }
  };

  const resetTheme = () => {
    localStorage.removeItem('app-theme');
    
    const defaultTheme = {
      '--primary': '217 91% 60%',
      '--background': '210 20% 98%',
      '--foreground': '224 71% 4%',
      '--card': '0 0% 100%',
      '--muted': '210 40% 96.1%',
      '--border': '214.3 31.8% 91.4%',
      '--font-main': 'Inter, sans-serif',
      '--font-secondary': 'Playfair Display, serif',
      '--radius': '0.5rem',
      '--p-font-size': '1rem',
      '--h1-font-size': '2.25rem',
      '--h2-font-size': '1.875rem',
      '--h3-font-size': '1.5rem',
      '--h4-font-size': '1.25rem',
      '--h5-font-size': '1.125rem',
      '--h6-font-size': '1rem',
    };
    
    Object.entries(defaultTheme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    
    setTheme({ ...initialTheme });
    
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default values.",
    });
  };

  // System configuration mutation
  const systemConfigMutation = useMutation({
    mutationFn: saveSystemConfig,
    onSuccess: () => {
      toast({
        title: "System Configuration Saved",
        description: "Default settings have been updated and will be used in AI workflows.",
      });
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
    },
    onError: (error: any) => {
      console.error('System config save error:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save system configuration",
        variant: "destructive",
      });
    }
  });

  const updateKeyMutation = useMutation({
    mutationFn: async ({ keyName, keyValue }: { keyName: string; keyValue: string }) => {
      console.log(`Updating ${keyName} with value: ${keyValue.substring(0, 10)}...`);
      return { success: true };
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: "API Key Updated", 
        description: `${variables.keyName} has been updated successfully.` 
      });
      setApiKeys(prev => ({ ...prev, [variables.keyName]: '' }));
    },
    onError: (error: any) => {
      toast({ 
        title: "Update failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleUpdateKey = (keyName: string) => {
    const keyValue = apiKeys[keyName as keyof typeof apiKeys];
    if (!keyValue.trim()) {
      toast({ 
        title: "Invalid input", 
        description: "Please enter a valid API key", 
        variant: "destructive" 
      });
      return;
    }
    updateKeyMutation.mutate({ keyName, keyValue });
  };

  const handleSaveSystemConfig = () => {
    systemConfigMutation.mutate(systemConfig);
  };

  const typographyAndSizingFields = [
    { key: '--h1-font-size', label: 'Heading 1 Size', placeholder: 'e.g., 2.25rem' },
    { key: '--h2-font-size', label: 'Heading 2 Size', placeholder: 'e.g., 1.875rem' },
    { key: '--h3-font-size', label: 'Heading 3 Size', placeholder: 'e.g., 1.5rem' },
    { key: '--h4-font-size', label: 'Heading 4 Size', placeholder: 'e.g., 1.25rem' },
    { key: '--h5-font-size', label: 'Heading 5 Size', placeholder: 'e.g., 1.125rem' },
    { key: '--h6-font-size', label: 'Heading 6 Size', placeholder: 'e.g., 1rem' },
    { key: '--p-font-size', label: 'Paragraph Size', placeholder: 'e.g., 1rem' },
    { key: '--radius', label: 'Border Radius', placeholder: 'e.g., 0.5rem' },
  ] as const;
  
const colorFields = (Object.keys(theme) as Array<keyof Theme>).filter(key => 
  key !== '--radius' &&
  !key.includes('-font-') && // Exclude all font-related fields
  !key.includes('-weight') && // Exclude all weight fields
  !key.includes('-size') // Exclude all size fields
);

const fontOptions = [
  { value: "Inter, sans-serif", label: 'Inter (Clean & Modern)', category: 'Sans Serif' },
  { value: "Poppins, sans-serif", label: 'Poppins (Friendly & Round)', category: 'Sans Serif' },
  { value: "Source Sans Pro, sans-serif", label: 'Source Sans Pro (Professional)', category: 'Sans Serif' },
  { value: "Lato, sans-serif", label: 'Lato (Humanist)', category: 'Sans Serif' },
  { value: "Montserrat, sans-serif", label: 'Montserrat (Geometric)', category: 'Sans Serif' },
  { value: "Open Sans, sans-serif", label: 'Open Sans (Neutral)', category: 'Sans Serif' },
  { value: "Roboto, sans-serif", label: 'Roboto (Google)', category: 'Sans Serif' },
  
  { value: "Playfair Display, serif", label: 'Playfair Display (Elegant)', category: 'Serif' },
  { value: "Merriweather, serif", label: 'Merriweather (Readable)', category: 'Serif' },
  { value: "Lora, serif", label: 'Lora (Calligraphic)', category: 'Serif' },
  { value: "Crimson Text, serif", label: 'Crimson Text (Classic)', category: 'Serif' },
  
  { value: "JetBrains Mono, monospace", label: 'JetBrains Mono (Code)', category: 'Monospace' },
  { value: "Fira Code, monospace", label: 'Fira Code (Technical)', category: 'Monospace' },
];

// Add these font weight options
const fontWeightOptions = [
  { value: '100', label: '100 - Thin' },
  { value: '200', label: '200 - Extra Light' },
  { value: '300', label: '300 - Light' },
  { value: '400', label: '400 - Normal' },
  { value: '500', label: '500 - Medium' },
  { value: '600', label: '600 - Semi Bold' },
  { value: '700', label: '700 - Bold' },
  { value: '800', label: '800 - Extra Bold' },
  { value: '900', label: '900 - Black' },
];

// Add this to your font weight fields array (put this after typographyAndSizingFields)
const fontWeightFields = [
  { key: '--h1-font-weight', label: 'H1 Weight', placeholder: 'e.g., 700' },
  { key: '--h2-font-weight', label: 'H2 Weight', placeholder: 'e.g., 600' },
  { key: '--h3-font-weight', label: 'H3 Weight', placeholder: 'e.g., 600' },
  { key: '--h4-font-weight', label: 'H4 Weight', placeholder: 'e.g., 500' },
  { key: '--h5-font-weight', label: 'H5 Weight', placeholder: 'e.g., 500' },
  { key: '--h6-font-weight', label: 'H6 Weight', placeholder: 'e.g., 500' },
  { key: '--p-font-weight', label: 'Paragraph Weight', placeholder: 'e.g., 400' },
  { key: '--font-main-weight', label: 'Default Body Weight', placeholder: 'e.g., 400' },
  { key: '--font-secondary-weight', label: 'Default Heading Weight', placeholder: 'e.g., 600' },
] as const;

const elementFontConfig = [
  { key: '--h1-font-family', label: 'H1 Font', description: 'Main page titles' },
  { key: '--h2-font-family', label: 'H2 Font', description: 'Section headings' },
  { key: '--h3-font-family', label: 'H3 Font', description: 'Subsection headings' },
  { key: '--h4-font-family', label: 'H4 Font', description: 'Minor headings' },
  { key: '--h5-font-family', label: 'H5 Font', description: 'Small headings' },
  { key: '--h6-font-family', label: 'H6 Font', description: 'Tiny headings' },
  { key: '--p-font-family', label: 'Paragraph Font', description: 'Main body text' },
  { key: '--body-font-family', label: 'Body Font', description: 'General text' },
  { key: '--button-font-family', label: 'Button Font', description: 'Button labels' },
  { key: '--input-font-family', label: 'Input Font', description: 'Form inputs' },
  { key: '--nav-font-family', label: 'Navigation Font', description: 'Menu items' },
  { key: '--card-title-font-family', label: 'Card Title Font', description: 'Card headings' },
] as const;


const elementSizeConfig = [
  { key: '--h1-font-size', label: 'H1 Size', placeholder: '2.25rem' },
  { key: '--h2-font-size', label: 'H2 Size', placeholder: '1.875rem' },
  { key: '--h3-font-size', label: 'H3 Size', placeholder: '1.5rem' },
  { key: '--h4-font-size', label: 'H4 Size', placeholder: '1.25rem' },
  { key: '--h5-font-size', label: 'H5 Size', placeholder: '1.125rem' },
  { key: '--h6-font-size', label: 'H6 Size', placeholder: '1rem' },
  { key: '--p-font-size', label: 'Paragraph Size', placeholder: '1rem' },
  { key: '--small-font-size', label: 'Small Text Size', placeholder: '0.875rem' },
  { key: '--large-font-size', label: 'Large Text Size', placeholder: '1.125rem' },
] as const;

const elementWeightConfig = [
  { key: '--h1-font-weight', label: 'H1 Weight' },
  { key: '--h2-font-weight', label: 'H2 Weight' },
  { key: '--h3-font-weight', label: 'H3 Weight' },
  { key: '--h4-font-weight', label: 'H4 Weight' },
  { key: '--h5-font-weight', label: 'H5 Weight' },
  { key: '--h6-font-weight', label: 'H6 Weight' },
  { key: '--p-font-weight', label: 'Paragraph Weight' },
  { key: '--button-font-weight', label: 'Button Weight' },
  { key: '--nav-font-weight', label: 'Navigation Weight' },
] as const;

  const fontPresets = [
    {
      name: "Modern Medical ⭐",
      description: "Perfect for dental AI content",
      headingFont: "Poppins, sans-serif",
      bodyFont: "Inter, sans-serif"
    },
    {
      name: "Classic Professional", 
      description: "Traditional and trustworthy",
      headingFont: "Playfair Display, serif",
      bodyFont: "Source Sans Pro, sans-serif"
    },
    {
      name: "Tech Forward",
      description: "Clean and modern",
      headingFont: "Montserrat, sans-serif", 
      bodyFont: "Open Sans, sans-serif"
    },
    {
      name: "Premium Elegant",
      description: "Sophisticated and polished", 
      headingFont: "Raleway, sans-serif",
      bodyFont: "Lato, sans-serif"
    }
  ];

const applyPresetToElements = (preset: 'all-serif' | 'all-sans' | 'mixed-traditional' | 'mixed-modern') => {
  let updates: Partial<Theme> = {};
  
  switch (preset) {
    case 'all-serif':
      elementFontConfig.forEach(({ key }) => {
        updates[key] = 'Playfair Display, serif';
      });
      break;
      
    case 'all-sans':
      elementFontConfig.forEach(({ key }) => {
        updates[key] = 'Inter, sans-serif';
      });
      break;
      
    case 'mixed-traditional':
      updates = {
        '--h1-font-family': 'Playfair Display, serif',
        '--h2-font-family': 'Playfair Display, serif',
        '--h3-font-family': 'Playfair Display, serif',
        '--h4-font-family': 'Merriweather, serif',
        '--h5-font-family': 'Merriweather, serif',
        '--h6-font-family': 'Merriweather, serif',
        '--p-font-family': 'Source Sans Pro, sans-serif',
        '--body-font-family': 'Source Sans Pro, sans-serif',
        '--button-font-family': 'Inter, sans-serif',
        '--input-font-family': 'Inter, sans-serif',
        '--nav-font-family': 'Inter, sans-serif',
        '--card-title-font-family': 'Playfair Display, serif',
      };
      break;
      
    case 'mixed-modern':
      updates = {
        '--h1-font-family': 'Poppins, sans-serif',
        '--h2-font-family': 'Poppins, sans-serif',
        '--h3-font-family': 'Montserrat, sans-serif',
        '--h4-font-family': 'Montserrat, sans-serif',
        '--h5-font-family': 'Inter, sans-serif',
        '--h6-font-family': 'Inter, sans-serif',
        '--p-font-family': 'Inter, sans-serif',
        '--body-font-family': 'Inter, sans-serif',
        '--button-font-family': 'Poppins, sans-serif',
        '--input-font-family': 'Inter, sans-serif',
        '--nav-font-family': 'Poppins, sans-serif',
        '--card-title-font-family': 'Poppins, sans-serif',
      };
      break;
  }
  
  return updates;
};

  const applyFontPreset = (preset: typeof fontPresets[0]) => {
    setTheme(prev => ({
      ...prev,
      '--font-main': preset.bodyFont,
      '--font-secondary': preset.headingFont
    }));
    toast({
      title: "Font Preset Applied",
      description: `Applied ${preset.name} font combination. Click "Save Theme" to persist.`,
    });
  };

  // 🔥 NEW: Save theme globally
  const saveThemeGlobally = async () => {
    try {
      await saveGlobalTheme(themeName, theme);
      
      toast({
        title: "🌍 Global Theme Saved!",
        description: "Theme has been applied globally to all users.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['global-theme'] });
      queryClient.invalidateQueries({ queryKey: ['all-global-themes'] });
    } catch (error) {
      toast({
        title: "Failed to save global theme",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // 🔥 NEW: Activate existing global theme
  const activateTheme = async (themeId: string) => {
    try {
      await activateGlobalTheme(themeId);
      
      toast({
        title: "✅ Theme Activated",
        description: "Global theme has been activated for all users.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['global-theme'] });
      queryClient.invalidateQueries({ queryKey: ['all-global-themes'] });
    } catch (error) {
      toast({
        title: "Failed to activate theme",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // 🔥 NEW: Update theme enforcement setting
  const updateThemeEnforcement = async (allowOverride: boolean) => {
    try {
      await updateSiteSetting('theme_enforcement', {
        enabled: true,
        allow_user_override: allowOverride
      }, 'theme');
      
      setAllowUserOverride(allowOverride);
      
      toast({
        title: "✅ Theme Enforcement Updated",
        description: `Users ${allowOverride ? 'can' : 'cannot'} override global themes.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['theme-override-permission'] });
    } catch (error) {
      toast({
        title: "Failed to update theme enforcement",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">
            Manage API keys, system configuration, and workflow settings.
          </p>
        </div>

        {/* 🔥 NEW: Theme Source Indicator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Current Theme Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={themeSource === 'global' ? 'default' : 'secondary'}>
                {themeSource === 'global' ? '🌍 Global Theme' : 
                 themeSource === 'user' ? '👤 User Theme' : '⚙️ Default Theme'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {themeSource === 'global' ? 'Applied globally to all users' :
                 themeSource === 'user' ? 'Applied locally to this user only' :
                 'Using system default theme'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 🔥 NEW: Global Theme Management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global Theme Management
            </CardTitle>
            <CardDescription>
              Manage themes that apply to all users across the site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Save as Global Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme-name">Theme Name</Label>
              <Input
                id="theme-name"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Enter theme name..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-as-global"
                checked={saveAsGlobal}
                onCheckedChange={(checked) => setSaveAsGlobal(checked as boolean)}
              />
              <Label htmlFor="save-as-global">Save as Global Theme (applies to all users)</Label>
            </div>

            <Button onClick={saveTheme} className="w-full">
              {saveAsGlobal ? '🌍 Save as Global Theme' : '�� Save as User Theme'}
            </Button>
          </CardContent>
        </Card>

        {/* 🔥 NEW: Existing Global Themes */}
        {allGlobalThemes && allGlobalThemes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Existing Global Themes
              </CardTitle>
              <CardDescription>
                Activate any of these themes to apply globally.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allGlobalThemes.map((globalTheme) => (
                  <div key={globalTheme.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{globalTheme.theme_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(globalTheme.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {globalTheme.is_active && (
                        <Badge variant="default">Active</Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => activateTheme(globalTheme.id)}
                        disabled={globalTheme.is_active}
                      >
                        {globalTheme.is_active ? 'Active' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🔥 NEW: Theme Enforcement Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Theme Enforcement
            </CardTitle>
            <CardDescription>
              Control whether users can override global themes with their own preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-user-override"
                  checked={allowUserOverride}
                  onCheckedChange={(checked) => updateThemeEnforcement(checked as boolean)}
                />
                <Label htmlFor="allow-user-override">
                  Allow users to override global themes with their own preferences
                </Label>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {allowUserOverride 
                  ? "Users can save their own theme preferences that override the global theme."
                  : "Users cannot override the global theme - only admins can change themes."
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isLoadingConfig ? (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-700">Loading system configuration...</span>
                </>
              ) : configError ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700">⚠️ System config connection failed - using defaults</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700">✅ Connected to system configuration</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 🔥 TEMPORARY: Font Test Card - Remove after testing */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🧪 Font Testing (Remove After Testing)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-red-600">TEST H1 HEADING - Should Change Font</h1>
              <h2 className="text-3xl font-semibold text-red-500">TEST H2 HEADING - Should Change Font</h2>
              <h3 className="text-2xl font-medium text-red-400">TEST H3 HEADING - Should Change Font</h3>
              <p className="text-base text-blue-600">TEST PARAGRAPH - Should use body font (different from headings)</p>
              <div className="text-base text-blue-500">TEST DIV TEXT - Should use body font</div>
              <span className="text-base text-blue-400">TEST SPAN TEXT - Should use body font</span>
            </div>
            
            <div className="bg-white p-3 rounded border text-sm space-y-1">
              <div><strong>Expected:</strong> Headings should use --font-secondary, body text should use --font-main</div>
              <div><strong>Current heading font:</strong> {theme['--font-secondary'] || 'Not set'}</div>
              <div><strong>Current body font:</strong> {theme['--font-main'] || 'Not set'}</div>
            </div>
            
            <Button 
              onClick={() => {
                // Force inspect current fonts
                const h1 = document.querySelector('h1');
                const p = document.querySelector('p');
                console.log('🔍 IMMEDIATE FONT CHECK:');
                console.log('H1 computed font:', h1 ? getComputedStyle(h1).fontFamily : 'No H1 found');
                console.log('P computed font:', p ? getComputedStyle(p).fontFamily : 'No P found');
                console.log('CSS --font-secondary:', getComputedStyle(document.documentElement).getPropertyValue('--font-secondary'));
                console.log('CSS --font-main:', getComputedStyle(document.documentElement).getPropertyValue('--font-main'));
                
                // Show alert with results
                const h1Font = h1 ? getComputedStyle(h1).fontFamily : 'No H1';
                const pFont = p ? getComputedStyle(p).fontFamily : 'No P';
                alert(`Fonts:\nH1: ${h1Font}\nP: ${pFont}\n\nCheck console for details.`);
              }}
              variant="outline" 
              size="sm"
            >
              🔍 Check Current Fonts (Console + Alert)
            </Button>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Management
            </CardTitle>
            <CardDescription>
              Configure API keys for different AI providers and external services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {keyStatuses.map((keyStatus) => (
              <div key={keyStatus.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{keyStatus.displayName}</h3>
                    <Badge variant={keyStatus.configured ? "default" : "secondary"}>
                      {keyStatus.configured ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configured
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Configured
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {keyStatus.description}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter new API key..."
                    value={apiKeys[keyStatus.name as keyof typeof apiKeys]}
                    onChange={(e) => setApiKeys(prev => ({ 
                      ...prev, 
                      [keyStatus.name]: e.target.value 
                    }))}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleUpdateKey(keyStatus.name)}
                    disabled={updateKeyMutation.isPending}
                  >
                    Update
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Default settings used by AI workflows and content generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="default-category">Default Article Category</Label>
                <Input
                  id="default-category"
                  placeholder="e.g., AI Generated"
                  value={systemConfig.defaultCategory}
                  onChange={(e) => setSystemConfig(prev => ({ 
                    ...prev, 
                    defaultCategory: e.target.value 
                  }))}
                  disabled={isLoadingConfig}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This category will be used by AI workflows and content generators
                </p>
              </div>
              <div>
                <Label htmlFor="default-author">Default Author Name</Label>
                <Input
                  id="default-author"
                  placeholder="e.g., AI Content Generator"
                  value={systemConfig.defaultAuthor}
                  onChange={(e) => setSystemConfig(prev => ({ 
                    ...prev, 
                    defaultAuthor: e.target.value 
                  }))}
                  disabled={isLoadingConfig}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This author name will be used for AI-generated articles
                </p>
              </div>
              <Button 
                onClick={handleSaveSystemConfig}
                disabled={systemConfigMutation.isPending || isLoadingConfig}
                className="bg-green-600 hover:bg-green-700"
              >
                {systemConfigMutation.isPending ? 'Saving...' : '💾 Save Configuration'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Sitemap Management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Sitemap
            </CardTitle>
            <CardDescription>
              Manage and view your XML sitemap for SEO.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Your sitemap is generated dynamically to include all published articles and categories.
            </p>
            <Button asChild variant="outline">
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                View Sitemap
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Font Presets Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Font Presets
            </CardTitle>
            <CardDescription>
              Quick font combinations for different styles. Apply a preset then save your theme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fontPresets.map((preset) => (
                <div key={preset.name} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{preset.name}</h4>
                    <Button size="sm" variant="outline" onClick={() => applyFontPreset(preset)}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{preset.description}</p>
                  <div className="text-xs space-y-1">
                    <div><strong>Headings:</strong> {preset.headingFont}</div>
                    <div><strong>Body:</strong> {preset.bodyFont}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Customization - Colors */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Palette
            </CardTitle>
            <CardDescription>
              Customize the application's colors. Colors should be in HSL format (e.g., 217 91% 60%).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {colorFields.map((key) => (
                <div key={key}>
                  <Label htmlFor={`theme-${key}`} className="capitalize">
                    {key.replace(/--/g, '').replace(/-/g, ' ')}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-8 h-8 rounded-md border" 
                      style={{ backgroundColor: `hsl(${theme[key]})` }}
                    ></div>
                    <Input
                      id={`theme-${key}`}
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      placeholder="e.g., 217 91% 60%"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Customization - Typography & Sizing */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Type className="h-5 w-5" />
      Typography & Sizing - Granular Control
    </CardTitle>
    <CardDescription>
      Control exactly which font each element uses. Assign different fonts to H1, H2, paragraphs, buttons, etc.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-8">
      
      {/* 🔥 SECTION 1: Quick Presets */}
      <div>
        <h4 className="font-semibold mb-3">Quick Font Presets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const updates = applyPresetToElements('all-serif');
              setTheme(prev => ({ ...prev, ...updates }));
              toast({ title: "Applied All Serif", description: "All elements now use serif fonts" });
            }}
          >
            📚 All Serif
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const updates = applyPresetToElements('all-sans');
              setTheme(prev => ({ ...prev, ...updates }));
              toast({ title: "Applied All Sans", description: "All elements now use sans-serif fonts" });
            }}
          >
            🎯 All Sans
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const updates = applyPresetToElements('mixed-traditional');
              setTheme(prev => ({ ...prev, ...updates }));
              toast({ title: "Applied Traditional Mix", description: "Serif headings, sans body text" });
            }}
          >
            🏛️ Traditional
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const updates = applyPresetToElements('mixed-modern');
              setTheme(prev => ({ ...prev, ...updates }));
              toast({ title: "Applied Modern Mix", description: "Modern font combination" });
            }}
          >
            🚀 Modern
          </Button>
        </div>
      </div>

      {/* 🔥 SECTION 2: Individual Font Assignment */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-3">Individual Font Assignment</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Choose exactly which font each element uses. This gives you complete control over your typography.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {elementFontConfig.map(({ key, label, description }) => (
            <div key={key} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor={`font-${key}`} className="font-medium">{label}</Label>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
              <Select 
                value={theme[key] || 'Inter, sans-serif'} 
                onValueChange={(value) => handleThemeChange(key, value)}
              >
                <SelectTrigger id={`font-${key}`}>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      <div>
                        <div className="font-medium">{font.label}</div>
                        <div className="text-xs text-muted-foreground">{font.category}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Preview */}
              <div 
                className="mt-2 text-sm p-2 bg-muted/50 rounded text-center"
                style={{ fontFamily: theme[key] || 'Inter, sans-serif' }}
              >
                Preview: {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 SECTION 3: Font Sizes */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-3">Font Sizes</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {elementSizeConfig.map(({ key, label, placeholder }) => (
            <div key={key}>
              <Label htmlFor={`size-${key}`}>{label}</Label>
              <Input
                id={`size-${key}`}
                value={theme[key]}
                onChange={(e) => handleThemeChange(key, e.target.value)}
                placeholder={placeholder}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 SECTION 4: Font Weights */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-3">Font Weights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {elementWeightConfig.map(({ key, label }) => (
            <div key={key}>
              <Label htmlFor={`weight-${key}`}>{label}</Label>
              <Select 
                value={theme[key] || '400'} 
                onValueChange={(value) => handleThemeChange(key, value)}
              >
                <SelectTrigger id={`weight-${key}`} className="mt-1">
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  {fontWeightOptions.map(weight => (
                    <SelectItem key={weight.value} value={weight.value}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 SECTION 5: Live Preview */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-3">Live Preview</h4>
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <h1 style={{ 
            fontFamily: theme['--h1-font-family'], 
            fontSize: theme['--h1-font-size'],
            fontWeight: theme['--h1-font-weight']
          }}>
            H1 Heading Preview
          </h1>
          <h2 style={{ 
            fontFamily: theme['--h2-font-family'], 
            fontSize: theme['--h2-font-size'],
            fontWeight: theme['--h2-font-weight']
          }}>
            H2 Heading Preview
          </h2>
          <h3 style={{ 
            fontFamily: theme['--h3-font-family'], 
            fontSize: theme['--h3-font-size'],
            fontWeight: theme['--h3-font-weight']
          }}>
            H3 Heading Preview
          </h3>
          <p style={{ 
            fontFamily: theme['--p-font-family'], 
            fontSize: theme['--p-font-size'],
            fontWeight: theme['--p-font-weight']
          }}>
            This is a paragraph preview. You can see how your body text will look with the selected font, size, and weight.
          </p>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            style={{ 
              fontFamily: theme['--button-font-family'],
              fontWeight: theme['--button-font-weight']
            }}
          >
            Button Preview
          </button>
        </div>
      </div>

    </div>

    {/* Save Buttons */}
    <div className="flex gap-2 mt-8">
      <Button onClick={saveTheme} className="bg-green-600 hover:bg-green-700">
        💾 Save All Typography Settings
      </Button>
      <Button variant="outline" onClick={resetTheme}>
        🔄 Reset to Defaults
      </Button>
    </div>
    
    <p className="text-sm text-muted-foreground mt-2">
      💡 <strong>Pro Tip:</strong> Use different fonts for different purposes - serif for headings (elegant), sans-serif for body text (readable), and consistent fonts for UI elements.
    </p>
  </CardContent>
</Card>
      </div>
    </main>
  );
};

export default AdminSettingsPage;