import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Workflow, Play, Settings, Plus, ArrowRight } from 'lucide-react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowSidebar from '@/components/workflow/WorkflowSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'scraper' | 'ai-processor' | 'filter' | 'publisher' | 'social-poster' | 'email-sender' | 'image-generator' | 'seo-analyzer' | 'translator';
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  connected: string[];
}

const WorkflowBuilderPage = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: '1',
      type: 'trigger',
      label: 'Schedule Trigger',
      position: { x: 100, y: 100 },
      config: { schedule: 'daily', time: '09:00' },
      connected: ['2']
    },
    {
      id: '2',
      type: 'scraper',
      label: 'Web Scraper',
      position: { x: 350, y: 100 },
      config: { urls: [], selector: 'article' },
      connected: ['3']
    },
    {
      id: '3',
      type: 'ai-processor',
      label: 'AI Content Generator',
      position: { x: 600, y: 100 },
      config: { provider: 'openai', model: 'gpt-4o-mini', prompt: 'Transform this content into a professional article' },
      connected: ['4']
    },
    {
      id: '4',
      type: 'publisher',
      label: 'Auto Publisher',
      position: { x: 850, y: 100 },
      config: { status: 'draft', category: 'AI Generated', autoPublishConditional: false },
      connected: []
    }
  ]);

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const { toast } = useToast();

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type,
      label: getNodeLabel(type),
      position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 30 },
      config: getDefaultConfig(type),
      connected: []
    };
    setNodes([...nodes, newNode]);
  };

  const getNodeLabel = (type: WorkflowNode['type']): string => {
    const labels = {
      trigger: 'New Trigger',
      scraper: 'Web Scraper',
      'ai-processor': 'AI Processor',
      filter: 'Content Filter',
      publisher: 'Publisher',
      'social-poster': 'Social Poster',
      'email-sender': 'Email Sender',
      'image-generator': 'Image Generator',
      'seo-analyzer': 'SEO Analyzer',
      'translator': 'Translator'
    };
    return labels[type];
  };

  const getDefaultConfig = (type: WorkflowNode['type']): Record<string, any> => {
    const configs = {
      trigger: { schedule: 'manual', time: '09:00' },
      scraper: { urls: [], selector: '', followPagination: false },
      'ai-processor': { provider: 'openai', model: 'gpt-4o-mini', contentType: 'article', prompt: '' },
      filter: { minWords: 100, maxWords: 2000 },
      publisher: { status: 'draft', category: 'AI Generated', autoPublishConditional: false },
      'social-poster': { platform: 'twitter', content: 'Check out our new article: {{article.title}} {{article.url}}' },
      'email-sender': { recipient: '', subject: 'New Article Published: {{article.title}}', body: 'Read it here: {{article.url}}' },
      'image-generator': { prompt: 'A futuristic image related to: {{article.title}}', provider: 'dall-e-3' },
      'seo-analyzer': { keywords: [], targetScore: 80 },
      'translator': { targetLanguage: 'es', provider: 'openai' }
    };
    return configs[type];
  };

  const updateNodeConfig = (nodeId: string, newConfig: Partial<WorkflowNode['config']>) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? { ...node, config: { ...node.config, ...newConfig } }
          : node
      )
    );
    // Also update selectedNode if it's the one being edited
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, config: { ...prev.config, ...newConfig } } : null);
    }
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prevNodes => {
      // Remove the node
      const newNodes = prevNodes.filter(node => node.id !== nodeId);
      // Remove any connections to the deleted node
      return newNodes.map(node => ({
        ...node,
        connected: node.connected.filter(id => id !== nodeId)
      }));
    });
    // If the deleted node was selected, unselect it
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    toast({ title: 'Node Deleted', description: 'The node has been removed from the workflow.' });
  };

  const connectNodes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return; // Cannot connect to self
    setNodes(prevNodes =>
      prevNodes.map(node => {
        if (node.id === sourceId) {
          // Avoid duplicate connections, replace existing for simplicity
          return { ...node, connected: [targetId] };
        }
        return node;
      })
    );
    setConnectingNodeId(null); // End connection mode
    toast({ title: 'Nodes Connected', description: 'A connection has been created.' });
  };

  const disconnectNode = (nodeId: string) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId ? { ...node, connected: [] } : node
      )
    );
    toast({ title: 'Node Disconnected', description: 'All outgoing connections have been removed.' });
  };

  const runWorkflow = async () => {
    setIsRunning(true);
    setExecutionLog(['Workflow started...']);

    const log = (message: string) => {
        setExecutionLog(prev => [...prev, message]);
    };

    try {
      const triggerNode = nodes.find(n => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in the workflow.');
      }

      let currentNode: WorkflowNode | null = triggerNode;
      let previousNodeOutput: any = {};

      while (currentNode) {
        log(`Executing: ${currentNode.label} (${currentNode.type})`);
        
        switch (currentNode.type) {
          case 'trigger':
            previousNodeOutput = { content: 'Trigger fired manually.' };
            break;

          case 'scraper': {
            const urls = currentNode.config.urls as string[];
            if (!urls || urls.length === 0) {
              throw new Error('Scraper node has no URLs configured.');
            }
            const urlToScrape = urls[0];
            log(`Scraping URL: ${urlToScrape}`);

            const { data: scraperData, error: scraperError } = await supabase.functions.invoke('web-scraper', {
              body: { url: urlToScrape, selector: currentNode.config.selector },
            });
            if (scraperError) throw scraperError;
            if (scraperData.error) throw new Error(scraperData.error);
            if (!scraperData.content && scraperData.content !== "") throw new Error('Scraper returned no content.');
            
            previousNodeOutput = { content: scraperData.content };
            log(`Scraping successful. Content length: ${scraperData.content.length}`);
            break;
          }

          case 'ai-processor': {
            const contentToProcess = previousNodeOutput.content || previousNodeOutput.article?.content;
            if (contentToProcess === undefined) {
              throw new Error('AI Processor has no content to process. Make sure it follows a node that provides content.');
            }
            log(`Sending content to ${currentNode.config.provider}...`);

            const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-content-generator', {
              body: {
                content: contentToProcess,
                provider: currentNode.config.provider,
                contentType: currentNode.config.contentType,
                prompt: currentNode.config.prompt,
              },
            });
            if (aiError) throw aiError;
            if (aiData.error) throw new Error(aiData.error);
            if (!aiData.content) throw new Error('AI Processor returned no content.');
            
            const processedContent = aiData.content;
            previousNodeOutput = { ...previousNodeOutput, content: processedContent, provider: currentNode.config.provider };
            // If an article was being processed, update its content as well to avoid stale data
            if (previousNodeOutput.article) {
              previousNodeOutput.article.content = processedContent;
            }

            log(`AI processing successful.`);
            break;
          }

          case 'publisher': {
            const contentToPublish = previousNodeOutput.content || previousNodeOutput.article?.content;
            if (!contentToPublish) {
              throw new Error('Publisher has no content to publish. Make sure it follows a node that provides content.');
            }
            log(`Publishing article...`);

            const { data: articleData, error: articleError } = await supabase.functions.invoke('create-article-from-ai', {
              body: {
                content: contentToPublish,
                provider: previousNodeOutput.provider || 'AI',
                category: currentNode.config.category,
                status: currentNode.config.status,
              },
            });
            if (articleError) throw articleError;
            if (articleData.error) throw new Error(articleData.error);

            // We replace the previous output, but also pass along the content for the next node.
            previousNodeOutput = { article: articleData.article, content: articleData.article.content };
            const finalStatus = currentNode.config.status || 'draft';
            log(`Article created as ${finalStatus}: ${articleData.article.title}`);
            break;
          }

          case 'social-poster': {
            if (!previousNodeOutput.article?.title || !previousNodeOutput.article?.slug) {
              throw new Error('Social Poster requires an article with a title and slug from the previous node.');
            }
            const article = previousNodeOutput.article;
            // In a real scenario, you'd get the full URL from config or env
            const articleUrl = `${window.location.origin}/article/${article.slug}`;
            log(`Preparing post for ${currentNode.config.platform}...`);
            log(`Content: ${currentNode.config.content.replace('{{article.title}}', article.title).replace('{{article.url}}', articleUrl)}`);
            log(`Social Poster node is not fully implemented yet. Skipping actual posting.`);
            previousNodeOutput = { ...previousNodeOutput };
            break;
          }
            
          case 'filter':
            log(`Filter node is not implemented yet. Skipping.`);
            previousNodeOutput = { ...previousNodeOutput };
            break;

          case 'email-sender': {
            if (!previousNodeOutput.article?.title || !previousNodeOutput.article?.slug) {
              throw new Error('Email Sender requires an article with a title and slug from the previous node.');
            }
            const article = previousNodeOutput.article;
            const articleUrl = `${window.location.origin}/article/${article.slug}`;

            const subject = (currentNode.config.subject || '')
              .replace(/{{article.title}}/g, article.title)
              .replace(/{{article.url}}/g, articleUrl);
              
            const body = (currentNode.config.body || '')
              .replace(/{{article.title}}/g, article.title)
              .replace(/{{article.url}}/g, articleUrl)
              .replace(/\n/g, '<br />');
            
            const recipient = currentNode.config.recipient;
            if (!recipient) {
              throw new Error('Email Sender has no recipient configured.');
            }

            log(`Sending email to ${recipient}...`);

            const { error: emailError } = await supabase.functions.invoke('send-email', {
              body: {
                to: recipient,
                subject: subject,
                body: body,
              },
            });

            if (emailError) throw emailError;

            log(`Email sent successfully to ${recipient}.`);
            previousNodeOutput = { ...previousNodeOutput };
            break;
          }

          case 'image-generator':
            log(`Image Generator node is not fully implemented yet. Skipping.`);
            previousNodeOutput = { ...previousNodeOutput };
            break;

          case 'seo-analyzer':
            log(`SEO Analyzer node is not fully implemented yet. Skipping.`);
            previousNodeOutput = { ...previousNodeOutput };
            break;

          case 'translator': {
            const contentToTranslate = previousNodeOutput.content || previousNodeOutput.article?.content;
            if (!contentToTranslate) {
              throw new Error('Translator has no content to translate. Make sure it follows a node that provides content or an article.');
            }
            log(`Translating content to ${currentNode.config.targetLanguage} using ${currentNode.config.provider}...`);

            const { data: translatorData, error: translatorError } = await supabase.functions.invoke('translator', {
              body: {
                content: contentToTranslate,
                targetLanguage: currentNode.config.targetLanguage,
                provider: currentNode.config.provider,
              },
            });

            if (translatorError) {
              console.error('Translator function invocation error:', translatorError);
              throw translatorError;
            }
            
            if (translatorData.error) {
              throw new Error(translatorData.error);
            }
            if (translatorData.content === undefined) {
              throw new Error('Translator returned no content.');
            }

            const translatedContent = translatorData.content;
            previousNodeOutput = { ...previousNodeOutput, content: translatedContent };
            if (previousNodeOutput.article) {
                previousNodeOutput.article.content = translatedContent;
            }

            log(`Translation successful using ${currentNode.config.provider}.`);
            break;
          }
        }

        const nextNodeId = currentNode.connected[0];
        currentNode = nextNodeId ? nodes.find(n => n.id === nextNodeId) || null : null;
      }

      log('Workflow completed successfully!');
      toast({ title: 'Success', description: 'Workflow executed successfully.' });

    } catch (error: any) {
      console.error("Workflow execution error:", error);
      let errorMessage = 'An unknown error occurred during workflow execution.';
      
      if (error) {
        if (error.context?.error) {
          errorMessage = typeof error.context.error === 'string' 
            ? error.context.error 
            : JSON.stringify(error.context.error);
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            // Cannot stringify, use default message.
          }
        }
      }
      
      log(`Error: ${errorMessage}`);
      toast({ title: 'Workflow Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      // Keep log visible after run
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex relative">
        {/* Sidebar */}
        <WorkflowSidebar 
          selectedNode={selectedNode}
          onAddNode={addNode}
          onUpdateNodeConfig={updateNodeConfig}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Workflow className="h-6 w-6" />
                  Visual Workflow Builder
                </h1>
                <p className="text-sm text-muted-foreground">
                  Drag and drop to create automated content workflows
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {nodes.length} Nodes
                </Badge>
                <Button
                  onClick={runWorkflow}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isRunning ? 'Running...' : 'Test Workflow'}
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <WorkflowCanvas 
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onUpdateNodes={setNodes}
              onDeleteNode={deleteNode}
              connectingNodeId={connectingNodeId}
              onConnectStart={setConnectingNodeId}
              onConnectEnd={connectNodes}
              onDisconnectNode={disconnectNode}
            />
          </div>
        </div>
        
        {/* Execution Log */}
        {executionLog.length > 0 && (
          <div className="absolute bottom-4 right-4 w-96 max-h-80 bg-background border rounded-lg shadow-xl flex flex-col z-20">
              <div className="p-3 border-b flex justify-between items-center">
                <h4 className="font-semibold">Execution Log</h4>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setIsRunning(false)} disabled={!isRunning}>
                    {isRunning ? 'Running...' : 'Done'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setExecutionLog([])}>Clear</Button>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-y-auto text-sm font-mono space-y-1">
                  {executionLog.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)}
              </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkflowBuilderPage;
