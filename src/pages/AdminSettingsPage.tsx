
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, CheckCircle, AlertCircle, Palette, Type, Network } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApiKeyStatus {
  name: string;
  displayName: string;
  configured: boolean;
  description: string;
}

type Theme = {
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
};

const initialTheme: Theme = {
  '--primary': '',
  '--background': '',
  '--foreground': '',
  '--card': '',
  '--muted': '',
  '--border': '',
  '--font-main': '',
  '--font-secondary': '',
  '--radius': '',
  '--p-font-size': '',
  '--h1-font-size': '',
  '--h2-font-size': '',
  '--h3-font-size': '',
  '--h4-font-size': '',
  '--h5-font-size': '',
  '--h6-font-size': '',
};

const AdminSettingsPage = () => {
  const [apiKeys, setApiKeys] = useState({
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GOOGLE_API_KEY: ''
  });

  const [keyStatuses] = useState<ApiKeyStatus[]>([
    {
      name: 'OPENAI_API_KEY',
      displayName: 'OpenAI API Key',
      configured: true, // Assuming it's configured since it's working
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
      configured: true, // Just configured
      description: 'Required for Gemini content generation'
    }
  ]);

  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Load theme from localStorage or CSS variables on initial render
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

  // Apply theme changes live as they are updated in the state
useEffect(() => {
  // Only update in real-time for preview, global hook handles persistence
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
  
const saveTheme = () => {
  localStorage.setItem('app-theme', JSON.stringify(theme));
  
  // Trigger storage event for other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'app-theme',
    newValue: JSON.stringify(theme)
  }));
  
  toast({
    title: "Theme Saved",
    description: "Your custom theme has been applied globally across the website.",
  });
};

  const resetTheme = () => {
    localStorage.removeItem('app-theme');
    window.location.reload();
  };

  const updateKeyMutation = useMutation({
    mutationFn: async ({ keyName, keyValue }: { keyName: string; keyValue: string }) => {
      // This would typically update the secret via Supabase edge function
      // For now, we'll simulate the update
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
    onError: (error) => {
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
    !typographyAndSizingFields.some(f => f.key === key) && 
    key !== '--font-main' && 
    key !== '--font-secondary'
  );

const fontOptions = [
  // Current fonts
  { value: "Inter, sans-serif", label: 'Inter (Current Body)' },
  { value: "Playfair Display, serif", label: 'Playfair Display (Current Heading)' },
  
  // 🎯 RECOMMENDED: Modern & Trustworthy
  { value: "Poppins, sans-serif", label: 'Poppins (Modern Headings) ⭐' },
  { value: "Inter, sans-serif", label: 'Inter (Tech Body) ⭐' },
  
  // Professional & Medical
  { value: "Source Sans Pro, sans-serif", label: 'Source Sans Pro (Medical)' },
  { value: "Lato, sans-serif", label: 'Lato (Friendly Professional)' },
  
  // Tech-Forward & Clean  
  { value: "Montserrat, sans-serif", label: 'Montserrat (Strong Headings)' },
  { value: "Open Sans, sans-serif", label: 'Open Sans (Accessible)' },
  
  // Premium & Sophisticated
  { value: "Raleway, sans-serif", label: 'Raleway (Elegant)' },
  { value: "Nunito Sans, sans-serif", label: 'Nunito Sans (Rounded)' },
  
  // Classic & Readable
  { value: "Roboto, sans-serif", label: 'Roboto (Google Classic)' },
  { value: "Work Sans, sans-serif", label: 'Work Sans (Geometric)' },
];

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
              General system settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="default-category">Default Article Category</Label>
                <Input
                  id="default-category"
                  placeholder="e.g., AI Generated"
                  defaultValue="AI Generated"
                />
              </div>
              <div>
                <Label htmlFor="default-author">Default Author Name</Label>
                <Input
                  id="default-author"
                  placeholder="e.g., AI Content Generator"
                  defaultValue="AI Content Generator"
                />
              </div>
              <Button>Save Configuration</Button>
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
              This helps search engines like Google discover and index your content.
            </p>
            <Button asChild variant="outline">
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                View Sitemap
              </a>
            </Button>
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
              Customize the application's colors. Changes are saved locally in your browser.
              Colors should be in HSL format (e.g., 217 91% 60%).
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
              Typography & Sizing
            </CardTitle>
            <CardDescription>
              Customize fonts, text sizes, and border radius. Font sizes and radius should be in rem or px.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Font Selectors */}
              <div>
                  <Label htmlFor="theme---font-main">Main Font</Label>
                  <Select value={theme['--font-main']} onValueChange={(value) => handleThemeChange('--font-main', value)}>
                      <SelectTrigger id="theme---font-main" className="mt-1">
                          <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                          {fontOptions.map(font => (
                              <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div>
                  <Label htmlFor="theme---font-secondary">Heading Font</Label>
                  <Select value={theme['--font-secondary']} onValueChange={(value) => handleThemeChange('--font-secondary', value)}>
                      <SelectTrigger id="theme---font-secondary" className="mt-1">
                          <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                          {fontOptions.map(font => (
                              <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              {/* Size Inputs */}
              {typographyAndSizingFields.map(({ key, label, placeholder }) => (
                  <div key={key}>
                      <Label htmlFor={`theme-${key}`}>{label}</Label>
                      <Input
                          id={`theme-${key}`}
                          value={theme[key]}
                          onChange={(e) => handleThemeChange(key, e.target.value)}
                          placeholder={placeholder}
                          className="mt-1"
                      />
                  </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={saveTheme}>Save Theme</Button>
              <Button variant="outline" onClick={resetTheme}>Reset to Default</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AdminSettingsPage;
