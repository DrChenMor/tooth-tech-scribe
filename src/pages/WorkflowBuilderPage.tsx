import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Workflow, Play, Settings, Plus, ArrowRight, Save, FolderOpen } from 'lucide-react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowSidebar from '@/components/workflow/WorkflowSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const [workflowName, setWorkflowName] = useState('');
  const [savedWorkflows, setSavedWorkflows] = useState<{id: string, name: string, nodes: WorkflowNode[]}[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const { toast } = useToast();

  // Load saved workflows from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedWorkflows');
    if (saved) {
      setSavedWorkflows(JSON.parse(saved));
    }
  }, []);

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
          // Add to existing connections if not already connected
          const newConnections = node.connected.includes(targetId) 
            ? node.connected 
            : [...node.connected, targetId];
          return { ...node, connected: newConnections };
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

  const saveWorkflow = () => {
    if (!workflowName.trim()) {
      toast({ title: 'Error', description: 'Please enter a workflow name', variant: 'destructive' });
      return;
    }

    const newWorkflow = {
      id: Date.now().toString(),
      name: workflowName,
      nodes: nodes
    };

    const updatedWorkflows = [...savedWorkflows, newWorkflow];
    setSavedWorkflows(updatedWorkflows);
    localStorage.setItem('savedWorkflows', JSON.stringify(updatedWorkflows));
    
    setWorkflowName('');
    setShowSaveDialog(false);
    toast({ title: 'Success', description: 'Workflow saved successfully!' });
  };

  const loadWorkflow = (workflow: {id: string, name: string, nodes: WorkflowNode[]}) => {
    setNodes(workflow.nodes);
    setShowLoadDialog(false);
    toast({ title: 'Success', description: `Loaded workflow: ${workflow.name}` });
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

      // Execute workflow with branching support
      const executeNode = async (currentNode: WorkflowNode, inputData: any) => {
        log(`Executing: ${currentNode.label} (${currentNode.type})`);
        
        let outputData = inputData;

        switch (currentNode.type) {
          case 'trigger':
            outputData = { content: 'Trigger fired manually.' };
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
            
            outputData = { content: scraperData.content };
            log(`Scraping successful. Content length: ${scraperData.content.length}`);
            break;
          }

          case 'ai-processor': {
            const contentToProcess = inputData.content || inputData.article?.content;
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
            outputData = { ...inputData, content: processedContent, provider: currentNode.config.provider };
            if (outputData.article) {
              outputData.article.content = processedContent;
            }

            log(`AI processing successful.`);
            break;
          }

          case 'publisher': {
            const contentToPublish = inputData.content || inputData.article?.content;
            if (!contentToPublish) {
              throw new Error('Publisher has no content to publish. Make sure it follows a node that provides content.');
            }
            log(`Publishing article...`);

            const { data: articleData, error: articleError } = await supabase.functions.invoke('create-article-from-ai', {
              body: {
                content: contentToPublish,
                provider: inputData.provider || 'AI',
                category: currentNode.config.category,
                status: currentNode.config.status,
              },
            });
            if (articleError) throw articleError;
            if (articleData.error) throw new Error(articleData.error);

            outputData = { article: articleData.article, content: articleData.article.content };
            const finalStatus = currentNode.config.status || 'draft';
            log(`Article created as ${finalStatus}: ${articleData.article.title}`);
            break;
          }

          case 'email-sender': {
            // More flexible email handling - work with any content or article
            let title = 'Generated Content';
            let articleUrl = window.location.origin;
            
            if (inputData.article?.title && inputData.article?.slug) {
              title = inputData.article.title;
              articleUrl = `${window.location.origin}/article/${inputData.article.slug}`;
            }

            const subject = (currentNode.config.subject || 'New Content: {{article.title}}')
              .replace(/{{article.title}}/g, title)
              .replace(/{{article.url}}/g, articleUrl);
              
            const body = (currentNode.config.body || 'Check out this content: {{article.url}}')
              .replace(/{{article.title}}/g, title)
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
            outputData = { ...inputData };
            break;
          }

          case 'translator': {
            const contentToTranslate = inputData.content || inputData.article?.content;
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
            outputData = { ...inputData, content: translatedContent };
            if (outputData.article) {
                outputData.article.content = translatedContent;
            }

            log(`Translation successful using ${currentNode.config.provider}.`);
            break;
          }

          default:
            log(`${currentNode.type} node is not fully implemented yet. Skipping.`);
            outputData = { ...inputData };
            break;
        }

        // Execute all connected nodes in parallel (branching)
        if (currentNode.connected.length > 0) {
          const nextNodes = currentNode.connected.map(nodeId => nodes.find(n => n.id === nodeId)).filter(Boolean);
          await Promise.all(
            nextNodes.map(nextNode => executeNode(nextNode!, outputData))
          );
        }
      };

      await executeNode(triggerNode, {});
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
      setIsRunning(false);
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
                
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter workflow name..."
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                      />
                      <Button onClick={saveWorkflow} className="w-full">
                        Save Workflow
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Load
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Load Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {savedWorkflows.length === 0 ? (
                        <p className="text-muted-foreground">No saved workflows</p>
                      ) : (
                        savedWorkflows.map((workflow) => (
                          <Card key={workflow.id} className="cursor-pointer hover:bg-muted/50" onClick={() => loadWorkflow(workflow)}>
                            <CardContent className="p-4">
                              <h4 className="font-medium">{workflow.name}</h4>
                              <p className="text-sm text-muted-foreground">{workflow.nodes.length} nodes</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

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
