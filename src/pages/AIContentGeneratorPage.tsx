
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

type AIProvider = 'openai' | 'claude' | 'gemini';

interface GenerateContentRequest {
  content: string;
  url?: string;
  provider: AIProvider;
  contentType: 'article' | 'summary' | 'analysis';
  category?: string;
}

const AIContentGeneratorPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [contentType, setContentType] = useState<'article' | 'summary' | 'analysis'>('article');
  const [category, setCategory] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (request: GenerateContentRequest) => {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: request
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast({ title: "Content generated successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Generation failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const createArticleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-article-from-ai', {
        body: {
          content: generatedContent,
          category: category || 'AI Generated',
          provider
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Article created and saved as draft!" });
      navigate('/admin');
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create article", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleGenerate = () => {
    if (!content.trim() && !url.trim()) {
      toast({ 
        title: "Input required", 
        description: "Please provide content or a URL to analyze", 
        variant: "destructive" 
      });
      return;
    }

    generateMutation.mutate({
      content,
      url,
      provider,
      contentType,
      category
    });
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      toast({ title: "Content copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Failed to copy content", variant: "destructive" });
    }
  };

  const providerNames = {
    openai: 'OpenAI GPT-4',
    claude: 'Anthropic Claude',
    gemini: 'Google Gemini'
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Content Generator</h1>
            <p className="text-muted-foreground">
              Transform any content into professional articles using AI. Paste content, add a URL, or provide raw text.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Content Input
                </CardTitle>
                <CardDescription>
                  Provide the source content you want to transform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="url">Website URL (optional)</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content to Process</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your content here, or leave empty if using URL above..."
                    className="min-h-[200px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>AI Provider</Label>
                    <Select value={provider} onValueChange={(value: AIProvider) => setProvider(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                        <SelectItem value="claude">Anthropic Claude</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Content Type</Label>
                    <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Full Article</SelectItem>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    placeholder="e.g. Technology, Healthcare, Industry News"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={generateMutation.isPending}
                  className="w-full"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating with {providerNames[provider]}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>
                  AI-processed content ready for publishing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">
                        Generated by {providerNames[provider]}
                      </Badge>
                      <Badge variant="outline">
                        {contentType}
                      </Badge>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {generatedContent}
                      </pre>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCopyContent}
                        className="flex-1"
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Content
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => createArticleMutation.mutate()}
                        disabled={createArticleMutation.isPending}
                        className="flex-1"
                      >
                        {createArticleMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Article'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generated content will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">1. Input Content</h4>
                  <p className="text-muted-foreground">
                    Either paste content directly or provide a URL to scrape content from a website.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. Configure AI</h4>
                  <p className="text-muted-foreground">
                    Choose your preferred AI provider and content type (article, summary, or analysis).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">3. Generate & Publish</h4>
                  <p className="text-muted-foreground">
                    Review the generated content and either copy it or create a draft article directly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AIContentGeneratorPage;
