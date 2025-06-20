
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'scraper' | 'rss-aggregator' | 'google-scholar-search' | 'news-discovery' | 'perplexity-research' | 'ai-processor' | 'multi-source-synthesizer' | 'filter' | 'publisher' | 'social-poster' | 'email-sender' | 'image-generator' | 'seo-analyzer' | 'translator' | 'content-quality-analyzer' | 'ai-seo-optimizer' | 'engagement-forecaster' | 'content-performance-analyzer' | 'article-structure-validator';
  label: string;
  position: { x: number; y: number };
  data: Record<string, any>; // Required by ReactFlow
  config: Record<string, any>;
  connected: string[];
}

export interface ExecutionLog {
  id: string;
  nodeId: string;
  nodeName: string;
  status: 'running' | 'completed' | 'error';
  message: string;
  timestamp: Date;
  data?: any;
}
