
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Code, Play, Copy, Check, Download, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AIAgentAdvancedPage = () => {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState('');
  const [sources, setSources] = useState('');
  const [qualityThreshold, setQualityThreshold] = useState(85);
  const [autoPublish, setAutoPublish] = useState(false);
  const [pythonAgentUrl, setPythonAgentUrl] = useState('http://localhost:8000');
  const [results, setResults] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const runAgentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.functions.invoke('python-ai-agent', {
        body: data
      });
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      setResults(data);
      toast({ title: "AI Agent completed successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Agent execution failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleRunAgent = () => {
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
    const sourceArray = sources.split(',').map(s => s.trim()).filter(s => s);

    if (!keywordArray.length) {
      toast({ 
        title: "Keywords required", 
        description: "Please provide at least one keyword", 
        variant: "destructive" 
      });
      return;
    }

    runAgentMutation.mutate({
      keywords: keywordArray,
      sources: sourceArray.length ? sourceArray : ['Google News', 'PubMed'],
      quality_threshold: qualityThreshold,
      auto_publish: autoPublish,
      python_agent_url: pythonAgentUrl
    });
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({ title: "Code copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Failed to copy code", variant: "destructive" });
    }
  };

  const pythonCode = `#!/usr/bin/env python3
"""
AI Content Agent - Python Script
This script does the actual web scraping, AI processing, and content formatting.
"""

import asyncio
import aiohttp
import json
import re
from datetime import datetime
from typing import List, Dict, Any
from dataclasses import dataclass
import logging

# You'll need to install these packages:
# pip install aiohttp beautifulsoup4 openai

from bs4 import BeautifulSoup
import openai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ProcessedArticle:
    title: str
    content: str
    seo_title: str
    seo_description: str
    tags: List[str]
    quality_score: int
    source_url: str

class ContentAgent:
    def __init__(self, openai_api_key: str):
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        
    async def scrape_content(self, keywords: List[str], sources: List[str]) -> List[Dict[str, Any]]:
        """
        Scrape content from various sources based on keywords
        This is a simplified example - you'll want to customize for your specific sources
        """
        scraped_content = []
        
        # Example: Search Google News (you can replace with your preferred sources)
        search_queries = [f"{keyword} dental AI" for keyword in keywords]
        
        async with aiohttp.ClientSession() as session:
            for query in search_queries[:3]:  # Limit to 3 searches for demo
                try:
                    # This is a basic example - replace with your actual scraping logic
                    url = f"https://news.google.com/search?q={query.replace(' ', '+')}"
                    
                    # Note: For production, you'll want proper scraping with headers, delays, etc.
                    async with session.get(url) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Extract article links and basic info
                            # This is simplified - you'll need to adapt to actual site structure
                            articles = soup.find_all('article', limit=5)
                            
                            for article in articles:
                                title_elem = article.find('h3') or article.find('h2') or article.find('h1')
                                if title_elem:
                                    scraped_content.append({
                                        'title': title_elem.get_text().strip()[:200],
                                        'content': f"Article about {query} found from search results",
                                        'source_url': url,
                                        'keywords': keywords
                                    })
                                    
                except Exception as e:
                    logger.error(f"Error scraping {query}: {e}")
                    
        return scraped_content[:10]  # Limit results
    
    async def process_with_ai(self, raw_content: Dict[str, Any], quality_threshold: int) -> ProcessedArticle:
        """
        Process raw content with AI to create formatted article
        """
        try:
            # Create a prompt for the AI
            prompt = f"""
            Based on this raw content about dental AI technology:
            
            Title: {raw_content['title']}
            Content: {raw_content['content']}
            Keywords: {', '.join(raw_content['keywords'])}
            
            Please create a professional article with:
            1. An engaging title (max 60 characters)
            2. Well-structured content (300-500 words)
            3. SEO-optimized title and description
            4. Relevant tags
            5. Rate the quality from 1-100
            
            Format your response as JSON with these keys:
            - title
            - content  
            - seo_title
            - seo_description
            - tags (array)
            - quality_score (number)
            """
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional content writer specializing in dental technology and AI. Create high-quality, informative articles."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            # Parse AI response
            ai_content = response.choices[0].message.content
            
            # Try to extract JSON from the response
            try:
                # Look for JSON in the response
                json_match = re.search(r'\\{.*\\}', ai_content, re.DOTALL)
                if json_match:
                    content_data = json.loads(json_match.group())
                else:
                    raise ValueError("No JSON found in AI response")
            except:
                # Fallback if JSON parsing fails
                content_data = {
                    "title": raw_content['title'][:60],
                    "content": ai_content[:500],
                    "seo_title": raw_content['title'][:60],
                    "seo_description": raw_content['title'][:160],
                    "tags": raw_content['keywords'],
                    "quality_score": 75
                }
            
            return ProcessedArticle(
                title=content_data.get('title', raw_content['title'])[:100],
                content=content_data.get('content', ai_content),
                seo_title=content_data.get('seo_title', content_data.get('title', ''))[:60],
                seo_description=content_data.get('seo_description', '')[:160],
                tags=content_data.get('tags', raw_content['keywords'])[:5],
                quality_score=content_data.get('quality_score', 75),
                source_url=raw_content['source_url']
            )
            
        except Exception as e:
            logger.error(f"Error processing with AI: {e}")
            # Return a basic processed article as fallback
            return ProcessedArticle(
                title=raw_content['title'][:100],
                content=f"Content about {', '.join(raw_content['keywords'])} processed on {datetime.now().strftime('%Y-%m-%d')}",
                seo_title=raw_content['title'][:60],
                seo_description=raw_content['title'][:160],
                tags=raw_content['keywords'][:5],
                quality_score=50,
                source_url=raw_content['source_url']
            )

async def process_content_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to process a content request
    """
    # Get OpenAI API key from environment or config
    import os
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    agent = ContentAgent(openai_api_key)
    
    keywords = data.get('keywords', [])
    sources = data.get('sources', [])
    quality_threshold = data.get('quality_threshold', 85)
    auto_publish = data.get('auto_publish', False)
    
    # Step 1: Scrape content
    logger.info(f"Scraping content for keywords: {keywords}")
    raw_articles = await agent.scrape_content(keywords, sources)
    
    # Step 2: Process with AI
    processed_articles = []
    for raw_article in raw_articles:
        try:
            processed = await agent.process_with_ai(raw_article, quality_threshold)
            processed_articles.append({
                'title': processed.title,
                'content': processed.content,
                'seo_title': processed.seo_title,
                'seo_description': processed.seo_description,
                'tags': processed.tags,
                'quality_score': processed.quality_score,
                'source_url': processed.source_url
            })
        except Exception as e:
            logger.error(f"Error processing article: {e}")
    
    # Filter by quality
    high_quality_articles = [
        article for article in processed_articles 
        if article['quality_score'] >= quality_threshold
    ]
    
    return {
        'articles_found': len(raw_articles),
        'articles_processed': len(processed_articles),
        'articles_published': len(high_quality_articles) if auto_publish else 0,
        'articles': high_quality_articles,
        'average_quality': sum(a['quality_score'] for a in processed_articles) / len(processed_articles) if processed_articles else 0
    }

# Simple HTTP server for testing
if __name__ == "__main__":
    from aiohttp import web
    
    async def handle_process(request):
        try:
            data = await request.json()
            result = await process_content_request(data)
            return web.json_response(result)
        except Exception as e:
            logger.error(f"Error handling request: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    app = web.Application()
    app.router.add_post('/process', handle_process)
    
    print("Starting Python agent server on http://localhost:8000")
    web.run_app(app, host='localhost', port=8000)`;

  const setupInstructions = `# Python AI Agent Setup Guide

## Step 1: Install Python Dependencies

\`\`\`bash
pip install aiohttp beautifulsoup4 openai
\`\`\`

## Step 2: Set Your OpenAI API Key

\`\`\`bash
export OPENAI_API_KEY="your-openai-api-key-here"
\`\`\`

## Step 3: Run the Python Agent

\`\`\`bash
python python_agent.py
\`\`\`

This will start a server on http://localhost:8000

## Step 4: Configure Your Supabase Environment

Add this environment variable to your Supabase Edge Function secrets:
- \`PYTHON_AGENT_URL\`: \`http://localhost:8000\` (for local testing)

## How It Works

1. Your web interface triggers the agent
2. Supabase Edge Function calls your Python script
3. Python script scrapes websites and processes with AI
4. Results are sent back and saved as articles in your database

## Next Steps

1. Customize the scraping logic in \`scrape_content()\` for your specific sources
2. Modify the AI prompt in \`process_with_ai()\` to match your content style
3. Deploy the Python script to a cloud service (Heroku, Railway, etc.) for production
4. Update \`PYTHON_AGENT_URL\` to point to your deployed service

## Testing

You can test the Python agent directly:

\`\`\`bash
curl -X POST http://localhost:8000/process \\
  -H "Content-Type: application/json" \\
  -d '{
    "keywords": ["dental AI", "machine learning"],
    "sources": ["PubMed"],
    "quality_threshold": 85,
    "auto_publish": false
  }'
\`\`\``;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Advanced AI Agent (Python Integration)</h1>
            <p className="text-muted-foreground">
              For developers who want to use custom Python scripts for advanced web scraping and AI processing.
            </p>
          </div>

          <Tabs defaultValue="setup" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
              <TabsTrigger value="code">Python Code</TabsTrigger>
              <TabsTrigger value="run">Run Agent</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="setup">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Setup Instructions
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to set up your Python AI agent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{setupInstructions}</pre>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleCopyCode(setupInstructions)}
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Instructions
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Python Agent Code
                  </CardTitle>
                  <CardDescription>
                    Complete Python script for web scraping and AI processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono">{pythonCode}</pre>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleCopyCode(pythonCode)}
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Python Code
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const blob = new Blob([pythonCode], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'python_agent.py';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download File
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="run">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Run Python Agent
                  </CardTitle>
                  <CardDescription>
                    Configure and execute your Python AI agent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        placeholder="dental AI, machine learning, healthcare"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sources">Sources (comma-separated)</Label>
                      <Input
                        id="sources"
                        placeholder="Google News, PubMed, ArXiv"
                        value={sources}
                        onChange={(e) => setSources(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="quality">Quality Threshold</Label>
                      <Select value={qualityThreshold.toString()} onValueChange={(value) => setQualityThreshold(Number(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="70">70 - Basic Quality</SelectItem>
                          <SelectItem value="80">80 - Good Quality</SelectItem>
                          <SelectItem value="85">85 - High Quality</SelectItem>
                          <SelectItem value="90">90 - Premium Quality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="agent-url">Python Agent URL</Label>
                      <Input
                        id="agent-url"
                        placeholder="http://localhost:8000"
                        value={pythonAgentUrl}
                        onChange={(e) => setPythonAgentUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-publish"
                      checked={autoPublish}
                      onChange={(e) => setAutoPublish(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="auto-publish">Auto-publish high quality articles</Label>
                  </div>

                  <Button
                    onClick={handleRunAgent}
                    disabled={runAgentMutation.isPending}
                    className="w-full"
                  >
                    {runAgentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Python Agent...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run Python Agent
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Results</CardTitle>
                  <CardDescription>
                    Results from your Python AI agent execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{results.articles_found}</div>
                          <div className="text-sm text-muted-foreground">Articles Found</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{results.articles_processed}</div>
                          <div className="text-sm text-muted-foreground">Processed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{results.articles_published}</div>
                          <div className="text-sm text-muted-foreground">Published</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{Math.round(results.average_quality)}</div>
                          <div className="text-sm text-muted-foreground">Avg Quality</div>
                        </div>
                      </div>

                      {results.articles && results.articles.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Generated Articles</h3>
                          {results.articles.map((article: any, index: number) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{article.title}</h4>
                                <Badge variant={article.quality_score >= 85 ? "default" : "secondary"}>
                                  Quality: {article.quality_score}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{article.seo_description}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline">{article.tags?.join(', ')}</Badge>
                                <a
                                  href={article.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  Source <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Run the Python agent to see results here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AIAgentAdvancedPage;
