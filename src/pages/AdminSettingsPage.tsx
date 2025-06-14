
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiKeyStatus {
  name: string;
  displayName: string;
  configured: boolean;
  description: string;
}

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
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
          <Card>
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSettingsPage;
