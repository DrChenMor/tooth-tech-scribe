// src/pages/WorkflowBuilderPage.tsx
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowSidebar from '@/components/workflow/WorkflowSidebar';
import { Play, Save, Download, Upload, Square, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowNode, ExecutionLog } from '@/types/WorkflowTypes';
import { executeArticleValidation } from '@/components/workflow/ArticleStructureValidator';
import { useQueryClient } from '@tanstack/react-query';

const WorkflowBuilderPage = () => {
  const queryClient = useQueryClient();
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Derive selectedNode from nodes array to ensure it's always current
  const selectedNode = selectedNodeId ? nodes.find(node => node.id === selectedNodeId) || null : null;

  const generateNodeLabel = (type: WorkflowNode['type']) => {
    const labels = {
      trigger: 'Trigger',
      scraper: 'Web Scraper',
      'rss-aggregator': 'RSS Aggregator',
      'google-scholar-search': 'Google Scholar Search',
      'news-discovery': 'News Discovery',
      'perplexity-research': 'Perplexity Research',
      'ai-processor': 'AI Processor',
      'multi-source-synthesizer': 'Multi-Source Synthesizer',
      filter: 'Filter',
      publisher: 'Publisher',
      'social-poster': 'Social Poster',
      'email-sender': 'Email Sender',
      'image-generator': 'Image Generator',
      'seo-analyzer': 'SEO Analyzer',
      translator: 'Translator',
      'content-quality-analyzer': 'Content Quality Analyzer',
      'ai-seo-optimizer': 'AI SEO Optimizer',
      'engagement-forecaster': 'Engagement Forecaster',
      'content-performance-analyzer': 'Content Performance Analyzer',
      'article-structure-validator': 'Article Structure Validator',
    };
    return labels[type];
  };

  const addLog = (nodeId: string, nodeName: string, status: ExecutionLog['status'], message: string, data?: any) => {
    const log: ExecutionLog = {
      id: Date.now().toString(),
      nodeId,
      nodeName,
      status,
      message,
      timestamp: new Date(),
      data
    };
    setExecutionLogs(prev => [...prev, log]);
  };

  // ACTUAL WORKFLOW EXECUTION ENGINE
  const executeNode = async (node: WorkflowNode, previousData: any = null): Promise<any> => {
    addLog(node.id, node.label, 'running', `Starting ${node.type} execution...`);

    try {
      let result: any = null;

      switch (node.type) {
        case 'trigger':
          result = { triggered: true, timestamp: new Date().toISOString() };
          addLog(node.id, node.label, 'completed', 'Workflow triggered successfully');
          break;

        case 'scraper':
          if (!node.config.urls || node.config.urls.length === 0) {
            throw new Error('No URLs configured for web scraper');
          }
          
          const scrapedContent = [];
          for (const url of node.config.urls) {
            try {
              const { data, error } = await supabase.functions.invoke('web-scraper', {
                body: { url, selector: node.config.selector }
              });
              if (error) throw new Error(error.message);
              scrapedContent.push({ 
                url, 
                content: data.content,
                source_reference: data.source_reference // ✅ This is already working - each scraped item has source_reference
              });
              addLog(node.id, node.label, 'completed', `Scraped content from ${url}`);
            } catch (error) {
              addLog(node.id, node.label, 'error', `Failed to scrape ${url}: ${error.message}`);
            }
          }
          result = { 
            scrapedContent, 
            urls: node.config.urls,
            // ✅ This is already working - each scraped item has source_reference
          };
          break;

        case 'rss-aggregator':
          if (!node.config.urls || node.config.urls.length === 0) {
            throw new Error('No RSS URLs configured');
          }
          
          const { data: rssData, error: rssError } = await supabase.functions.invoke('rss-aggregator', {
            body: { urls: node.config.urls }
          });
          if (rssError) throw new Error(rssError.message);
          
          result = { articles: rssData.articles };
          addLog(node.id, node.label, 'completed', `Fetched ${rssData.articles.length} articles from RSS feeds`);
          break;

        case 'google-scholar-search':
          if (!node.config.query) {
            throw new Error('No search query configured');
          }
          
          const { data: scholarData, error: scholarError } = await supabase.functions.invoke('google-scholar-search', {
            body: {
              query: node.config.query,
              maxResults: node.config.maxResults || 20,
              yearFrom: node.config.yearFrom,
              yearTo: node.config.yearTo,
              includeAbstracts: node.config.includeAbstracts,
              multiplePages: true // 🔥 Enable multiple page fetching
            }
          });
          if (scholarError) throw new Error(scholarError.message);
          
          result = { papers: scholarData.papers };
          addLog(node.id, node.label, 'completed', `Found ${scholarData.papers.length} academic papers`);
          break;

        case 'news-discovery':
          if (!node.config.keywords) {
            throw new Error('No keywords configured for news discovery');
          }
          
          const { data: newsData, error: newsError } = await supabase.functions.invoke('news-discovery', {
            body: {
              keywords: node.config.keywords,
              source: node.config.source || 'all',
              timeRange: node.config.timeRange || 'day',
              maxResults: node.config.maxResults || 10
            }
          });
          if (newsError) throw new Error(newsError.message);
          
          result = { articles: newsData.articles };
          addLog(node.id, node.label, 'completed', `Discovered ${newsData.articles.length} news articles`);
          break;

        case 'perplexity-research':
          if (!node.config.query) {
            throw new Error('No research query configured');
          }
          
          const { data: researchData, error: researchError } = await supabase.functions.invoke('perplexity-research', {
            body: {
              query: node.config.query,
              depth: node.config.depth || 'medium',
              includeSources: node.config.includeSources
            }
          });
          if (researchError) throw new Error(researchError.message);
          
          result = { 
            research: researchData.research, 
            sources: researchData.sources,
            relatedQuestions: researchData.relatedQuestions
          };
          addLog(node.id, node.label, 'completed', `Completed research with ${researchData.sources.length} sources`);
          break;


// Update for WorkflowBuilderPage.tsx - Image Generator case in executeNode function

case 'image-generator':
  console.log('🎯 IMAGE GENERATOR: Starting execution...');
  console.log('🎯 IMAGE GENERATOR: Previous data received:', {
    hasTitle: !!previousData?.title,
    hasContent: !!previousData?.processedContent || !!previousData?.synthesizedContent,
    titlePreview: previousData?.title?.substring(0, 50),
    contentPreview: (previousData?.processedContent || previousData?.synthesizedContent || '')?.substring(0, 100)
  });
  console.log('🎯 IMAGE GENERATOR: Node config:', node.config);
  
  // Step 1: Build the enhanced image request with ALL available data and user control
  const imageGenRequest = {
    // PRIORITY: User's explicit prompt from "Image Prompt" field
    prompt: node.config.imagePrompt || '',
    
    // Pass title and content for context (only used if no explicit prompt)
    title: previousData?.title || '',
    content: previousData?.processedContent || previousData?.synthesizedContent || '',
    
    // User's additional styling instructions
    customInstructions: node.config.customInstructions || '',
    
    // 🔧 UPDATED: Use the correct AI model names
    aiModel: node.config.aiModel || 'google-imagen-3', // Default to Google Imagen 3
    style: node.config.imageStyle || 'natural',
    size: node.config.imageSize || '1024x1024',
    quality: node.config.imageQuality || 'medium',
    
    // NEW: Force generation of new image (skip cache if user has explicit prompt)
    forceGenerate: !!(node.config.imagePrompt && node.config.imagePrompt.trim())
  };
  
  console.log('🎯 IMAGE GENERATOR: Sending request with user control:', {
    hasExplicitPrompt: !!imageGenRequest.prompt,
    hasTitle: !!imageGenRequest.title,
    hasContent: !!imageGenRequest.content,
    hasCustomInstructions: !!imageGenRequest.customInstructions,
    forceGenerate: imageGenRequest.forceGenerate,
    aiModel: imageGenRequest.aiModel,
    promptPreview: imageGenRequest.prompt?.substring(0, 50) || 'No explicit prompt',
    titlePreview: imageGenRequest.title?.substring(0, 50) || 'No title'
  });
  
  // Determine what will be used for the image
  let promptSource = '';
  if (imageGenRequest.prompt) {
    promptSource = `user prompt: "${imageGenRequest.prompt.substring(0, 50)}..."`;
  } else if (imageGenRequest.title) {
    promptSource = `article title: "${imageGenRequest.title.substring(0, 50)}..."`;
  } else {
    promptSource = 'fallback prompt';
  }
  
  addLog(node.id, node.label, 'running', 
    `Generating image using ${promptSource}. Model: ${imageGenRequest.aiModel}. Force new: ${imageGenRequest.forceGenerate}`);
  
  // Step 2: Call the improved image generation function
  const { data: imageData, error: imageError } = await supabase.functions.invoke('image-generator', {
    body: imageGenRequest
  });
  
  if (imageError) {
    console.error('🎯 IMAGE GENERATOR: Error from edge function:', imageError);
    throw new Error(`Image generation failed: ${imageError.message}`);
  }
  
  console.log('🎯 IMAGE GENERATOR: Response from edge function:', imageData);
  
  // Step 3: Prepare result data with all information
  result = { 
    ...previousData, // Pass through ALL previous data including title and content
    imageUrl: imageData.imageUrl,
    imagePrompt: imageData.prompt, // The actual prompt that was used
    imagePromptSource: promptSource,
    imageStyle: node.config.imageStyle,
    imageSize: node.config.imageSize,
    aiModelUsed: imageGenRequest.aiModel,
    wasImageReused: imageData.wasReused || false,
    imageFileName: imageData.fileName || 'unknown',
    forcedGeneration: imageGenRequest.forceGenerate,
    wasAIGenerated: imageData.wasAIGenerated || false,
    generatedWith: imageData.generatedWith || 'Unknown'
  };
  
  // Step 4: Log success with detailed information
  if (imageData.wasAIGenerated) {
    addLog(node.id, node.label, 'completed', 
      `✅ NEW AI image generated with ${imageData.generatedWith}: ${imageData.fileName}. Prompt used: "${imageData.prompt?.substring(0, 100)}..."`);
    console.log('🎯 IMAGE GENERATOR: ✅ New AI image generated successfully');
  } else {
    addLog(node.id, node.label, 'completed', 
      `⚠️ Placeholder image used (${imageData.generatedWith}): ${imageData.fileName}. AI generation failed.`);
    console.log('🎯 IMAGE GENERATOR: ⚠️ Fallback to placeholder image');
  }
  
  console.log('🎯 IMAGE GENERATOR: ✅ Final result:', {
    imageUrl: result.imageUrl,
    promptUsed: imageData.prompt?.substring(0, 100),
    fileName: result.imageFileName,
    title: result.title,
    wasAIGenerated: result.wasAIGenerated,
    aiModel: result.aiModelUsed
  });
  break;
          
        case 'seo-analyzer':
          // Accept more content fields for SEO analysis
          const contentToAnalyze =
            previousData.processedContent ||
            previousData.synthesizedContent ||
            previousData.translatedContent ||
            (Array.isArray(previousData.scrapedContent) ? previousData.scrapedContent.map((item: any) => item.content || '').join('\n\n') : previousData.scrapedContent) ||
            previousData.content ||
            '';
          const titleToAnalyze = previousData.title || 'Untitled';
          
          if (!contentToAnalyze || contentToAnalyze.length < 10) {
            throw new Error('No content to analyze for SEO. Connect this node to content sources.');
          }
          addLog(node.id, node.label, 'running', `Analyzing SEO for content (${contentToAnalyze.length} characters)`);
          const { data: seoData, error: seoError } = await supabase.functions.invoke('seo-analyzer', {
            body: {
              content: contentToAnalyze,
              title: titleToAnalyze,
              aiModel: node.config.aiModel || 'gemini-2.5-flash-preview-05-20',
              customInstructions: node.config.customInstructions,
              targetKeywords: node.config.targetKeywords,
              analysisFocus: node.config.analysisFocus
            }
          });
          if (seoError) throw new Error(seoError.message);
          
          result = { 
            ...previousData, // 🔥 CRITICAL: Pass through ALL previous data including source_references
            seoAnalysis: seoData.analysis,
            seoScore: seoData.analysis.seo_score,
            seoSuggestions: seoData.analysis.improvements
            // source_references will be preserved from previousData spread
          };
          
          console.log('SEO Analyzer: Preserved source references:', result.source_references?.length || 0);
          addLog(node.id, node.label, 'completed', `SEO analysis completed. Score: ${seoData.analysis.seo_score}/100`);
          break;
          
        case 'multi-source-synthesizer':
          // Enhanced input handling - accept various data formats
          let sources = [];
          let allSourceReferences = [];
          
          if (previousData) {
            if (previousData.scrapedContent && Array.isArray(previousData.scrapedContent)) {
              sources.push(...previousData.scrapedContent.map((item: any) => ({
                title: item.url || 'Scraped Content',
                url: item.url || '',
                content: item.content || ''
              })));
              
              // 🔥 COLLECT SOURCE REFERENCES
              allSourceReferences.push(...previousData.scrapedContent
                .map((item: any) => item.source_reference)
                .filter(ref => ref));
            }
            
            if (previousData.articles && Array.isArray(previousData.articles)) {
              sources.push(...previousData.articles.map((item: any) => ({
                title: item.title || 'Article',
                url: item.link || item.url || '',
                content: item.description || item.content || item.summary || ''
              })));
              
              // 🔥 COLLECT SOURCE REFERENCES
              allSourceReferences.push(...previousData.articles
                .map((item: any) => item.source_reference)
                .filter(ref => ref));
            }
            
            if (previousData.papers && Array.isArray(previousData.papers)) {
              sources.push(...previousData.papers.map((item: any) => ({
                title: item.title || 'Research Paper',
                url: item.url || '',
                content: item.abstract || item.content || ''
              })));
              
              // 🔥 COLLECT SOURCE REFERENCES
              allSourceReferences.push(...previousData.papers
                .map((item: any) => item.source_reference)
                .filter(ref => ref));
            }
            
            // Also check for existing source_references
            if (previousData.source_references && Array.isArray(previousData.source_references)) {
              allSourceReferences.push(...previousData.source_references);
            }
            
            // Handle research data from Perplexity
            if (previousData.research) {
              sources.push({
                title: 'Research Findings',
                url: '',
                content: previousData.research
              });
            }
            
            // Handle direct content
            if (previousData.content) {
              sources.push({
                title: 'Content',
                url: '',
                content: previousData.content
              });
            }
            
            // Handle string data directly
            if (typeof previousData === 'string') {
              sources.push({
                title: 'Input Content',
                url: '',
                content: previousData
              });
            }
          }
          
          if (sources.length === 0) {
            throw new Error('No content sources found. Connect this node to web scrapers, RSS feeds, news discovery, research tools, or other content sources.');
          }
          
          addLog(node.id, node.label, 'running', `Synthesizing content from ${sources.length} sources`);
          
          const { data: synthData, error: synthError } = await supabase.functions.invoke('multi-source-synthesizer', {
            body: {
              sources,
              style: node.config.style || 'comprehensive',
              targetLength: node.config.targetLength || 'medium',
              maintainAttribution: node.config.maintainAttribution !== false,
              resolveConflicts: node.config.resolveConflicts !== false,
              aiModel: node.config.aiModel || 'gemini-2.5-flash-preview-05-20',
              customInstructions: node.config.customInstructions
            }
          });
          
          if (synthError) throw new Error(synthError.message);
          
          // Remove duplicate source references
          allSourceReferences = allSourceReferences.filter((ref, index, arr) => 
            arr.findIndex(r => r.url === ref.url) === index
          );
          
          result = { 
            synthesizedContent: synthData.synthesizedContent,
            sourceCount: synthData.sourceCount,
            style: synthData.style,
            source_references: allSourceReferences // 🔥 PRESERVE ALL SOURCES
          };
          
          addLog(node.id, node.label, 'completed', 
            `Synthesized content from ${synthData.sourceCount} sources with ${allSourceReferences.length} source references`);
          break;

// FIX: Update the AI Processor case in executeNode function
// The issue is that AI Processor is returning data that triggers another fan-out

case 'ai-processor':
  try {
    console.log('AI Processor: Processing content...');
    
    // Get the content to process from previous data
    const contentToProcess = previousData || {};
    
    // 🔥 ENHANCED: Extract source references from ALL possible data formats
    let sourceReferences = [];
    
    // Method 1: Direct source_references array (from single item processing)
    if (contentToProcess.source_references && Array.isArray(contentToProcess.source_references)) {
      sourceReferences.push(...contentToProcess.source_references);
      console.log('AI Processor: Found direct source_references:', contentToProcess.source_references.length);
    }
    
    // Method 2: From scraped content array
    if (contentToProcess.scrapedContent && Array.isArray(contentToProcess.scrapedContent)) {
      const scrapedRefs = contentToProcess.scrapedContent
        .map((item: any) => item.source_reference)
        .filter(ref => ref);
      sourceReferences.push(...scrapedRefs);
      console.log('AI Processor: Found scraped source references:', scrapedRefs.length);
    }
    
    // Method 3: From articles array (news, RSS, etc.)
    if (contentToProcess.articles && Array.isArray(contentToProcess.articles)) {
      const articleRefs = contentToProcess.articles
        .map((article: any) => article.source_reference)
        .filter(ref => ref);
      sourceReferences.push(...articleRefs);
      console.log('AI Processor: Found article source references:', articleRefs.length);
    }
    
    // Method 4: From papers array (Google Scholar)
    if (contentToProcess.papers && Array.isArray(contentToProcess.papers)) {
      const paperRefs = contentToProcess.papers
        .map((paper: any) => paper.source_reference)
        .filter(ref => ref);
      sourceReferences.push(...paperRefs);
      console.log('AI Processor: Found paper source references:', paperRefs.length);
    }
    
    // Method 5: Single source reference
    if (contentToProcess.source_reference) {
      sourceReferences.push(contentToProcess.source_reference);
      console.log('AI Processor: Found single source reference');
    }
    
    // Remove duplicates based on URL
    sourceReferences = sourceReferences.filter((ref, index, arr) => 
      arr.findIndex(r => r.url === ref.url) === index
    );
    
    console.log('AI Processor: Total unique source references:', sourceReferences.length);
    
    // Get ALL configuration from node.config
    const contentType = node.config.contentType || 'article';
    const writingStyle = node.config.writingStyle || 'Professional';
    const targetAudience = node.config.targetAudience || 'General readers';
    const category = node.config.category || 'General';
    const customInstructions = node.config.customInstructions || '';
    const wordCount = node.config.wordCount || 'medium';
    const contentFocus = node.config.contentFocus || 'balanced';
    const tone = node.config.tone || 'neutral';
    const language = node.config.language || 'en';
    const outputFormat = node.config.outputFormat || 'markdown';
    const seoOptimized = node.config.seoOptimized !== false;
    const includeCitations = node.config.includeCitations || false;
    
    console.log('AI Processor: Using configuration:', {
      contentType, writingStyle, targetAudience, wordCount, contentFocus, tone, language
    });
    
    // Extract content from various possible sources
    let sourceContent = '';
    if (contentToProcess.articles && Array.isArray(contentToProcess.articles)) {
      sourceContent = contentToProcess.articles.map((article: any) => 
        `Title: ${article.title || 'Untitled'}\nContent: ${article.description || article.content || ''}`
      ).join('\n\n');
    } else if (contentToProcess.synthesizedContent) {
      sourceContent = contentToProcess.synthesizedContent;
    } else if (contentToProcess.research) {
      sourceContent = contentToProcess.research;
    } else if (contentToProcess.scrapedContent && Array.isArray(contentToProcess.scrapedContent)) {
      sourceContent = contentToProcess.scrapedContent.map((item: any) => item.content || '').join('\n\n');
    } else if (typeof contentToProcess === 'string') {
      sourceContent = contentToProcess;
    } else {
      sourceContent = JSON.stringify(contentToProcess);
    }
    
    // Build word count guidelines
    const wordCountGuides = {
      'short': '300-500 words',
      'medium': '500-800 words', 
      'long': '800-1200 words',
      'extended': '1200+ words'
    };
    const wordCountGuide = wordCountGuides[wordCount as keyof typeof wordCountGuides] || '500-800 words';
    
    // Build enhanced, dynamic prompt using ALL the configuration
    const enhancedPrompt = `
You are an expert content writer. Create a ${contentType} based on the following content and specifications.

**CONTENT SPECIFICATIONS:**
- Content Type: ${contentType}
- Writing Style: ${writingStyle}
- Target Audience: ${targetAudience}
- Content Focus: ${contentFocus}
- Tone of Voice: ${tone}
- Target Length: ${wordCountGuide}
- Language: ${language}
- Category: ${category}
${seoOptimized ? '- SEO Optimized: Include SEO-friendly headings and structure' : ''}
${includeCitations ? '- Include Citations: Add source references where appropriate' : ''}

**CUSTOM INSTRUCTIONS:**
${customInstructions || 'No additional instructions provided.'}

**CRITICAL FORMATTING RULES:**
- Start with a clear, engaging title as an H1 heading using # (not ** for bold)
- Use proper ${outputFormat} formatting: # for main title, ## for sections, ### for subsections
- NO bold titles (**title**) - only use # Title format
- Create engaging, well-structured content suitable for publication
- Include relevant subheadings to organize the content (##, ###)
- Ensure the content matches the ${writingStyle} writing style
- Write for ${targetAudience} audience using ${tone} tone
- Focus on ${contentFocus} approach
- Use lists, emphasis, and proper paragraph structure
- The title should be descriptive and engaging, not generic

**TARGET AUDIENCE GUIDELINES:**
${targetAudience === 'Experts' ? 'Use technical terminology and assume deep knowledge of the subject.' :
  targetAudience === 'Beginners' ? 'Explain concepts clearly and avoid jargon.' :
  targetAudience === 'Students' ? 'Make content educational and easy to understand.' :
  'Write for a general audience with clear explanations.'}

**WRITING STYLE GUIDELINES:**
${writingStyle === 'Academic' ? 'Use formal language, citations, and structured arguments.' :
  writingStyle === 'Funny' ? 'Use funny language like you are comedian.' :
  writingStyle === 'Conversational' ? 'Use friendly, approachable language like talking to a friend.' :
  writingStyle === 'Technical' ? 'Focus on precise, technical details and specifications.' :
  writingStyle === 'Creative' ? 'Use engaging storytelling and creative elements.' :
  'Use professional but accessible language.'}

**CONTENT FOCUS GUIDELINES:**
${contentFocus === 'informative' ? 'Focus on providing educational value and comprehensive information.' :
  contentFocus === 'practical' ? 'Emphasize actionable advice and step-by-step guidance.' :
  contentFocus === 'analytical' ? 'Provide deep analysis and critical thinking.' :
  'Balance information, analysis, and practical insights.'}

**Source Content to Transform:**
${sourceContent}

Generate the ${contentType} now following all specifications above:`;

    // Use the configured AI model
    const agentConfig = {
      ai_model: node.config.aiModel || 'gemini-2.5-flash-preview-05-20',
      provider: node.config.aiModel?.startsWith('gemini-') ? 'Google' : 
               node.config.aiModel?.startsWith('gpt-') ? 'OpenAI' : 
               node.config.aiModel?.startsWith('claude-') ? 'Anthropic' : 'Google'
    };

    console.log('AI Processor: Using AI model:', agentConfig.ai_model);

    const { data: aiResult, error: aiError } = await supabase.functions.invoke('run-ai-agent-analysis', {
      body: { prompt: enhancedPrompt, agentConfig }
    });

    if (aiError) {
      throw new Error(`AI processing failed: ${aiError.message}`);
    }

    let processedContent = aiResult.analysis;
    
    // Clean any potential JSON formatting that might have slipped through
    if (processedContent.includes('```') || processedContent.trim().startsWith('{')) {
      processedContent = processedContent
        .replace(/```(?:json|markdown)?\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();
        
      if (processedContent.startsWith('{')) {
        try {
          const parsed = JSON.parse(processedContent);
          processedContent = parsed.content || parsed.text || processedContent;
        } catch (e) {
          console.log('Could not parse as JSON, using raw content');
        }
      }
    }

    // Ensure content starts with a proper title if it doesn't have one
    if (!processedContent.trim().startsWith('#')) {
      const lines = processedContent.split('\n');
      const firstMeaningfulLine = lines.find(line => line.trim().length > 10) || 'Generated Article';
      processedContent = `# ${firstMeaningfulLine}\n\n${processedContent}`;
    }

    // Extract the title from the markdown and remove it from content
    const titleMatch = processedContent.match(/^#\s+(.+)/m);
    const extractedTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
    
    // Remove the title line from content to prevent duplication
    const contentWithoutTitle = processedContent.replace(/^#\s+.+\n\n?/m, '').trim();
    
    console.log('AI Processor: Content generated successfully');
    console.log('AI Processor: Extracted title:', extractedTitle);
    console.log('AI Processor: Content preview:', contentWithoutTitle.substring(0, 200));
    
    // 🔥 CRITICAL FIX: Return data in the format expected by downstream nodes
    // DO NOT return articles array - return flat structure
    result = {
      // Pass through original data that might be needed
      ...contentToProcess,
      
      // Add the processed content at the top level
      title: extractedTitle,
      content: contentWithoutTitle,
      processedContent: contentWithoutTitle,
      processedBy: `AI Processor (${agentConfig.ai_model})`,
      
      // 🔥 PRESERVE SOURCE REFERENCES
      source_references: sourceReferences,
      
      // Include all the configuration that was used
      category: category,
      contentType: contentType,
      writingStyle: writingStyle,
      targetAudience: targetAudience,
      contentFocus: contentFocus,
      tone: tone,
      language: language,
      outputFormat: outputFormat,
      wordCountTarget: wordCountGuide,
      seoOptimized: seoOptimized,
      includeCitations: includeCitations,
      aiModelUsed: agentConfig.ai_model,
      
      // Meta information
      generatedAt: new Date().toISOString(),
      configurationUsed: {
        contentType, writingStyle, targetAudience, category, 
        wordCount, contentFocus, tone, language, outputFormat
      }
    };
    
    console.log('AI Processor: Preserved', sourceReferences.length, 'source references');
    
    // 🔥 REMOVE: Do NOT include articles array that triggers fan-out
    // Delete any articles property to prevent another fan-out
    delete result.articles;
    
    console.log('AI Processor: Final result structure:', {
      hasTitle: !!result.title,
      hasProcessedContent: !!result.processedContent,
      hasArticles: !!result.articles, // Should be false
      resultKeys: Object.keys(result)
    });
    
    addLog(node.id, node.label, 'completed', 
      `Content processed successfully with title: "${extractedTitle}" using ${writingStyle} style for ${targetAudience} audience (${wordCountGuide})`);
    break;
  } catch (error) {
    console.error('AI Processor error:', error);
    throw new Error(`AI Processor failed: ${error.message}`);
  }

case 'publisher':
  if (!previousData || (!previousData.processedContent && !previousData.synthesizedContent)) {
    throw new Error('No processed content to publish. Connect this node to an AI Processor that generates structured content.');
  }
  
  const contentToPublish = previousData.processedContent || previousData.synthesizedContent;
  const titleToPublish = previousData.title || 'Untitled Article';
  
  // Get image URL from previous nodes (Image Generator)
  const articleImageUrl = previousData.imageUrl || null;
  
  // 🔥 CRITICAL: Extract source references from previous data
  const sourceReferences = previousData.source_references || [];
  
  console.log('Publisher: Publishing with', sourceReferences.length, 'source references');
  
  // Use English slug if available (from translator), otherwise create one
  let slugToUse = '';
  if (previousData.englishSlug) {
    slugToUse = previousData.englishSlug;
  } else {
    slugToUse = titleToPublish
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim();
  }
  
  addLog(node.id, node.label, 'running', 
    `Publishing article: "${titleToPublish}" with slug: ${slugToUse}${articleImageUrl ? ' (with featured image)' : ''} and ${sourceReferences.length} sources`);
  
  const formattedContent = {
    title: titleToPublish,
    content: contentToPublish,
    slug: slugToUse,
    image_url: articleImageUrl,
    isRTL: previousData.isRTL || false,
    targetLanguage: previousData.targetLanguage || 'en'
  };
  
  // 🔥 CRITICAL: Pass source references to create-article-from-ai function
  const { data: publishResult, error: publishError } = await supabase.functions.invoke('create-article-from-ai', {
    body: {
      content: JSON.stringify(formattedContent),
      category: node.config.category || previousData.category || 'AI Generated',
      provider: previousData.aiModel || 'AI Processor',
      status: node.config.status || 'draft',
      reporterId: node.config.reporterId,
      source_references: sourceReferences // 🔥 ADD THIS LINE
    }
  });

  if (publishError) throw new Error(publishError.message);
  
  // 🔥 CRITICAL: Invalidate the correct query caches
  queryClient.invalidateQueries({ queryKey: ['published-articles'] }); // For Index and ArticlesPage
  queryClient.invalidateQueries({ queryKey: ['admin-articles'] }); // For AdminPage
  queryClient.invalidateQueries({ queryKey: ['articles'] }); // Legacy fallback
  
  result = { 
    articleId: publishResult.article.id,
    title: publishResult.article.title,
    slug: publishResult.article.slug,
    status: publishResult.article.status,
    imageUrl: articleImageUrl,
    url: `/articles/${publishResult.article.slug}`,
    source_references: sourceReferences
  };
  
  addLog(node.id, node.label, 'completed', 
    `Article published: "${publishResult.article.title}" (${publishResult.article.status}) - Cache invalidated`);
  break;

// FIND AND COMPLETELY REPLACE the existing 'translator' case in your executeNode function
// Remove ALL existing translator code and replace with this:

case 'translator':
  console.log('🌍 TRANSLATOR: =============== STARTING EXECUTION ===============');
  console.log('🌍 TRANSLATOR: Previous data received:', {
    dataType: typeof previousData,
    isNull: previousData === null,
    isUndefined: previousData === undefined,
    dataKeys: previousData ? Object.keys(previousData) : [],
    hasProcessedContent: !!previousData?.processedContent,
    hasSynthesizedContent: !!previousData?.synthesizedContent,
    hasContent: !!previousData?.content,
    hasTitle: !!previousData?.title,
    hasArticles: !!previousData?.articles,
    processedContentType: typeof previousData?.processedContent,
    processedContentLength: previousData?.processedContent?.length || 0,
    titleType: typeof previousData?.title,
    titleLength: previousData?.title?.length || 0,
    fullDataDump: JSON.stringify(previousData, null, 2)
  });
  
  if (!previousData) {
    console.error('🌍 TRANSLATOR: ❌ previousData is null/undefined');
    throw new Error('No data received by translator. Connect this node to a content source.');
  }
  
  // Try to get content from multiple possible sources
  const translatorContentToTranslate = previousData.processedContent || 
                            previousData.synthesizedContent || 
                            previousData.content ||
                            '';
  
  const translatorTitleToTranslate = previousData.title || '';
  
  console.log('🌍 TRANSLATOR: Content analysis:', {
    contentToTranslate_exists: !!translatorContentToTranslate,
    contentToTranslate_length: translatorContentToTranslate.length,
    contentToTranslate_type: typeof translatorContentToTranslate,
    contentToTranslate_preview: translatorContentToTranslate.substring(0, 200),
    titleToTranslate_exists: !!translatorTitleToTranslate,
    titleToTranslate_length: translatorTitleToTranslate.length,
    titleToTranslate_preview: translatorTitleToTranslate
  });
  
  if (!translatorContentToTranslate && !translatorTitleToTranslate) {
    console.error('🌍 TRANSLATOR: ❌ No valid content or title found');
    console.error('🌍 TRANSLATOR: Available data:', {
      processedContent: previousData.processedContent,
      synthesizedContent: previousData.synthesizedContent,
      content: previousData.content,
      title: previousData.title,
      allKeys: Object.keys(previousData)
    });
    throw new Error('No content found to translate. Available data: ' + Object.keys(previousData).join(', '));
  }
  
  const translatorTargetLanguage = node.config.targetLanguage || 'he'; // Default to Hebrew
  const translatorProvider = node.config.provider || 'google';
  
  console.log('🌍 TRANSLATOR: Translation configuration:', {
    targetLanguage: translatorTargetLanguage,
    provider: translatorProvider,
    nodeConfig: node.config
  });
  
  addLog(node.id, node.label, 'running', `Translating to ${translatorTargetLanguage} using ${translatorProvider}. Content: ${translatorContentToTranslate.length} chars, Title: ${translatorTitleToTranslate.length} chars`);
  
  let translatorTranslatedContent = translatorContentToTranslate;
  let translatorTranslatedTitle = translatorTitleToTranslate;
  
  // Translate content if it exists
  if (translatorContentToTranslate && translatorContentToTranslate.length > 0) {
    console.log('🌍 TRANSLATOR: 📞 Calling translator edge function for content...');
    console.log('🌍 TRANSLATOR: Request payload:', {
      content: translatorContentToTranslate.substring(0, 100) + '...',
      targetLanguage: translatorTargetLanguage,
      provider: translatorProvider,
      contentLength: translatorContentToTranslate.length
    });
    
    try {
      const { data: contentTranslation, error: contentError } = await supabase.functions.invoke('translator', {
        body: {
          content: translatorContentToTranslate,
          targetLanguage: translatorTargetLanguage,
          provider: translatorProvider
        }
      });
      
      console.log('🌍 TRANSLATOR: Content translation response:', {
        hasData: !!contentTranslation,
        hasError: !!contentError,
        error: contentError,
        dataKeys: contentTranslation ? Object.keys(contentTranslation) : [],
        translatedLength: contentTranslation?.content?.length || 0,
        translatedPreview: contentTranslation?.content?.substring(0, 100)
      });
      
      if (contentError) {
        console.error('🌍 TRANSLATOR: ❌ Content translation failed:', contentError);
        throw new Error(`Content translation failed: ${contentError.message}`);
      }
      
      if (!contentTranslation?.content) {
        console.error('🌍 TRANSLATOR: ❌ Translation response missing content:', contentTranslation);
        throw new Error('Translation service returned empty content');
      }
      
      translatorTranslatedContent = contentTranslation.content;
      console.log('🌍 TRANSLATOR: ✅ Content translation successful');
      
    } catch (err) {
      console.error('🌍 TRANSLATOR: ❌ Content translation error:', err);
      throw new Error(`Content translation failed: ${err.message}`);
    }
  }
  
  // Translate title if it exists
  if (translatorTitleToTranslate && translatorTitleToTranslate.length > 0) {
    console.log('🌍 TRANSLATOR: 📞 Calling translator edge function for title...');
    
    try {
      const { data: titleTranslation, error: titleError } = await supabase.functions.invoke('translator', {
        body: {
          content: translatorTitleToTranslate,
          targetLanguage: translatorTargetLanguage,
          provider: translatorProvider
        }
      });
      
      console.log('🌍 TRANSLATOR: Title translation response:', {
        hasData: !!titleTranslation,
        hasError: !!titleError,
        error: titleError,
        translatedTitle: titleTranslation?.content
      });
      
      if (titleError) {
        console.warn('🌍 TRANSLATOR: ⚠️ Title translation failed, using original:', titleError);
        translatorTranslatedTitle = translatorTitleToTranslate;
      } else if (titleTranslation?.content) {
        translatorTranslatedTitle = titleTranslation.content;
        console.log('🌍 TRANSLATOR: ✅ Title translation successful');
      } else {
        console.warn('🌍 TRANSLATOR: ⚠️ Title translation returned empty, using original');
        translatorTranslatedTitle = translatorTitleToTranslate;
      }
      
    } catch (err) {
      console.warn('🌍 TRANSLATOR: ⚠️ Title translation error, using original:', err);
      translatorTranslatedTitle = translatorTitleToTranslate;
    }
  }
  
  // Create English slug from ORIGINAL title
  const translatorEnglishSlugBase = previousData.title || translatorTitleToTranslate || 'translated-article';
  let translatorEnglishSlug = translatorEnglishSlugBase
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
  
  if (!translatorEnglishSlug || translatorEnglishSlug.length < 3) {
    const timestamp = Date.now().toString().slice(-6);
    translatorEnglishSlug = `${translatorTargetLanguage}-article-${timestamp}`;
  }
  
  // Detect RTL languages
  const translatorRtlLanguages = ['he', 'ar', 'fa', 'ur'];
  const translatorIsRTL = translatorRtlLanguages.includes(translatorTargetLanguage || '');
  
  result = { 
    title: translatorTranslatedTitle,
    processedContent: translatorTranslatedContent,
    translatedContent: translatorTranslatedContent,
    translatedTitle: translatorTranslatedTitle,
    englishSlug: translatorEnglishSlug,
    targetLanguage: translatorTargetLanguage,
    isRTL: translatorIsRTL,
    originalContent: translatorContentToTranslate,
    originalTitle: translatorTitleToTranslate,
    category: previousData.category,
    aiModel: previousData.aiModel,
    imageUrl: previousData.imageUrl,
    seoAnalysis: previousData.seoAnalysis,
    source_references: previousData.source_references || [] // 🔥 PRESERVE SOURCES
  };
  
  console.log('Translator: Preserved', result.source_references?.length || 0, 'source references');
  
  console.log('🌍 TRANSLATOR: =============== FINAL RESULT ===============');
  console.log('🌍 TRANSLATOR: Final result:', {
    hasTranslatedTitle: !!result.title,
    hasTranslatedContent: !!result.translatedContent,
    titleLength: result.title?.length || 0,
    contentLength: result.translatedContent?.length || 0,
    slug: result.englishSlug,
    isRTL: result.isRTL,
    targetLanguage: result.targetLanguage,
    resultKeys: Object.keys(result)
  });
  
  addLog(node.id, node.label, 'completed', `✅ Translated to ${translatorTargetLanguage}. Title: "${translatorTranslatedTitle.substring(0, 50)}..." (${translatorTranslatedContent.length} chars)`);
  console.log('🌍 TRANSLATOR: =============== EXECUTION COMPLETE ===============');
  break;
          
        case 'article-structure-validator':
          if (!previousData || (!previousData.processedContent && !previousData.synthesizedContent)) {
            throw new Error('No content to validate. Connect this node to a content processor.');
          }
          
          const validationResult = await executeArticleValidation(node, previousData);
          
          result = {
            ...previousData, // Pass through original data
            validation: validationResult,
            qualityScore: validationResult.score,
            isValid: validationResult.isValid
          };
          
          const scoreColor = validationResult.score >= 80 ? 'excellent' : 
                           validationResult.score >= 60 ? 'good' : 'needs improvement';
          
          addLog(node.id, node.label, validationResult.isValid ? 'completed' : 'error', 
            `Article validation ${scoreColor} (${validationResult.score}/100). ${validationResult.issues.length} issues found.`);
          
          // Log specific issues if any
          if (validationResult.issues.length > 0) {
            validationResult.issues.forEach(issue => {
              addLog(node.id, node.label, 'error', `Issue: ${issue}`);
            });
          }
          
          break;

        default:
          // For nodes without implementations, just pass through the data
          result = previousData || { message: `${node.type} node executed (placeholder)` };
          addLog(node.id, node.label, 'completed', `${node.type} executed (no specific implementation yet)`);
          break;
      }

      return result;
    } catch (error) {
      addLog(node.id, node.label, 'error', `Error: ${error.message}`);
      throw error;
    }
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Add some nodes to run the workflow');
      return;
    }

    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      toast.error('Add a trigger node to start the workflow');
      return;
    }

    setIsExecuting(true);
    setExecutionLogs([]);
    setShowLogs(true);
    
    try {
      // Start with trigger nodes
      for (const triggerNode of triggerNodes) {
        let currentData = await executeNode(triggerNode);
        
        // Execute connected nodes in sequence
        await executeConnectedNodes(triggerNode, currentData);
      }
      
      toast.success('Workflow execution completed!');
    } catch (error) {
      toast.error(`Workflow execution failed: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // 🔥 ================================================================== 🔥
  // 🔥                    NEW, GENERALIZED FAN-OUT ENGINE                 🔥
  // 🔥 ================================================================== 🔥
// Fixed executeConnectedNodes function in WorkflowBuilderPage.tsx

// FIXED VERSION: Replace executeConnectedNodes and helper functions
// This version processes ALL items in fan-out scenarios

const executeConnectedNodes = async (currentNode: WorkflowNode, data: any) => {
  console.log(`🔄 EXECUTE CONNECTED NODES: ${currentNode.label} with ${currentNode.connected.length} connections`);
  console.log(`🔄 Data:`, {
    dataKeys: data ? Object.keys(data) : [],
    hasScrapedContent: !!data?.scrapedContent,
    scrapedContentCount: data?.scrapedContent?.length || 0,
    hasArticles: !!data?.articles,
    articlesCount: data?.articles?.length || 0,
    hasPapers: !!data?.papers,
    papersCount: data?.papers?.length || 0
  });

  if (currentNode.connected.length === 0) {
    console.log(`🔄 No connections for ${currentNode.label}, stopping`);
    return;
  }

  // Determine if we need to fan out
  let itemsToProcess: any[] | null = null;
  
  if (data?.scrapedContent && Array.isArray(data.scrapedContent) && data.scrapedContent.length > 0) {
    itemsToProcess = data.scrapedContent;
  } else if (data?.articles && Array.isArray(data.articles) && data.articles.length > 0) {
    itemsToProcess = data.articles;
  } else if (data?.papers && Array.isArray(data.papers) && data.papers.length > 0) {
    itemsToProcess = data.papers;
  }

  if (itemsToProcess && itemsToProcess.length > 0) {
    console.log(`🔄 FAN-OUT MODE: Processing ${itemsToProcess.length} items`);
    await handleFanOut(currentNode, data, itemsToProcess);
  } else {
    console.log(`🔄 LINEAR MODE: Processing single data object`);
    await handleLinearChain(currentNode, data);
  }
};

// Handle fan-out scenario - Process EACH item through ALL connected nodes
const handleFanOut = async (currentNode: WorkflowNode, originalData: any, itemsToProcess: any[]) => {
  // Apply any filtering based on node type
  let processedItems = itemsToProcess;
  
  if (currentNode.type === 'news-discovery') {
    processedItems = itemsToProcess.slice(0, 2);
    addLog(currentNode.id, currentNode.label, 'completed', `Fan-out: Found ${itemsToProcess.length} articles. Processing the top ${processedItems.length}.`);
  } else if (currentNode.type === 'google-scholar-search') {
    const maxPapers = currentNode.config.maxPapers || 5;
    processedItems = itemsToProcess.slice(0, maxPapers);
    addLog(currentNode.id, currentNode.label, 'completed', `Fan-out: Found ${itemsToProcess.length} papers. Processing top ${processedItems.length} papers.`);
  } else {
    addLog(currentNode.id, currentNode.label, 'completed', `Fan-out: Found ${itemsToProcess.length} items. Processing each individually.`);
  }

  console.log(`🔄 Fan-out: Will process ${processedItems.length} items through ${currentNode.connected.length} connected nodes`);

  // 🔥 CRITICAL: Process EACH item through ALL connected chains
  for (let i = 0; i < processedItems.length; i++) {
    const item = processedItems[i];
    const branchLogId = `${currentNode.id}-branch-${i + 1}`;
    
    addLog(branchLogId, `Branch ${i + 1}/${processedItems.length}`, 'running', 
      `Starting branch for: "${(item.title || item.url || 'Untitled').substring(0, 50)}..."`);

    try {
      // 🔥 CRITICAL: Package the single item with its source reference
      let itemData: any;
      
      if (originalData.scrapedContent) {
        itemData = {
          articles: [{
            title: item.url || 'Scraped Content',
            content: item.content,
            url: item.url
          }],
          // 🔥 PRESERVE SOURCE REFERENCE
          source_references: [item.source_reference].filter(ref => ref)
        };
      } else if (originalData.articles) {
        itemData = { 
          articles: [item],
          // 🔥 PRESERVE SOURCE REFERENCE
          source_references: [item.source_reference].filter(ref => ref)
        };
      } else if (originalData.papers) {
        itemData = {
          articles: [{
            title: item.title,
            content: item.abstract,
            url: item.url,
            authors: item.authors,
            year: item.year
          }],
          // 🔥 PRESERVE SOURCE REFERENCE
          source_references: [item.source_reference].filter(ref => ref)
        };
      } else {
        itemData = { 
          articles: [item],
          source_references: [item.source_reference].filter(ref => ref)
        };
      }

      console.log(`🔄 Initial data for branch ${i + 1}:`, {
        hasArticles: !!itemData.articles,
        sourceReferencesCount: itemData.source_references?.length || 0,
        dataKeys: Object.keys(itemData)
      });

      console.log(`🔄 Processing item ${i + 1}/${processedItems.length}:`, {
        itemTitle: item.title || item.url || 'Untitled',
        itemDataKeys: Object.keys(itemData)
      });

      // 🔥 FIXED: Process this item through ALL connected nodes (not just the first one)
      await processItemThroughAllConnections(currentNode, itemData, branchLogId, i + 1, processedItems.length);
      
      addLog(branchLogId, `Branch ${i + 1}/${processedItems.length}`, 'completed', 
        `Finished branch for: "${(item.title || item.url || 'Untitled').substring(0, 50)}..."`);
        
    } catch (error: any) {
      console.error(`❌ Error in branch ${i + 1}:`, error);
      addLog(branchLogId, `Branch ${i + 1} - Error`, 'error', `Error in branch: ${error.message}`);
    }
  }
};

// Process a single item through ALL connected nodes
const processItemThroughAllConnections = async (
  startNode: WorkflowNode, 
  initialData: any, 
  logId: string, 
  itemIndex: number, 
  totalItems: number
) => {
  let currentData = initialData;
  
  console.log(`🔄 ITEM ${itemIndex}/${totalItems}: Processing through ${startNode.connected.length} connections`);

  // 🔥 CRITICAL: Process ALL connected nodes for this item
  for (let connectionIndex = 0; connectionIndex < startNode.connected.length; connectionIndex++) {
    const connectedNodeId = startNode.connected[connectionIndex];
    const connectedNode = nodes.find(n => n.id === connectedNodeId);
    
    if (!connectedNode) {
      console.error(`❌ Connected node not found: ${connectedNodeId}`);
      continue;
    }

    console.log(`🔄 ITEM ${itemIndex}: Processing connection ${connectionIndex + 1}/${startNode.connected.length}: ${connectedNode.label}`);
    console.log(`🔄 Data being passed to ${connectedNode.label}:`, {
      hasTitle: !!currentData.title,
      hasContent: !!currentData.content,
      hasProcessedContent: !!currentData.processedContent,
      hasTranslatedContent: !!currentData.translatedContent,
      dataKeys: Object.keys(currentData)
    });

    try {
      // 🔥 AUTO AI PROCESSOR: Only for direct publisher connections without processed content
      if (
        connectedNode.type === 'publisher' &&
        (!currentData.processedContent && !currentData.synthesizedContent && !currentData.translatedContent) &&
        (!currentData.articles?.[0]?.processedContent && !currentData.articles?.[0]?.synthesizedContent)
      ) {
        console.log('🤖 Auto-inserting AI Processor before Publisher');
        
        const tempAIProcessorNode: WorkflowNode = {
          ...connectedNode,
          id: `${connectedNode.id}-auto-ai-processor`,
          type: 'ai-processor',
          label: 'Auto AI Processor',
          config: {
            writingStyle: 'Professional',
            targetAudience: 'General readers',
            contentType: 'article',
          },
          connected: [],
        };

        const aiProcessed = await executeNode(tempAIProcessorNode, currentData);
        const publisherResult = await executeNode(connectedNode, aiProcessed);
        currentData = publisherResult;
        
      } else {
        // 🔥 NORMAL EXECUTION: Execute the connected node
        const result = await executeNode(connectedNode, currentData);
        
        console.log(`🔄 ITEM ${itemIndex}: ${connectedNode.label} completed:`, {
          hasTitle: !!result.title,
          hasProcessedContent: !!result.processedContent,
          hasTranslatedContent: !!result.translatedContent,
          resultKeys: Object.keys(result)
        });
        
        // 🔥 CRITICAL: Update current data for next node in the chain
        currentData = result;
        
        // 🔥 IMPORTANT: Recursively process this node's connections
        if (connectedNode.connected.length > 0) {
          console.log(`🔄 ITEM ${itemIndex}: ${connectedNode.label} has connections, processing recursively...`);
          await executeConnectedNodes(connectedNode, currentData);
        }
      }
      
    } catch (error: any) {
      console.error(`❌ Error in ${connectedNode.label} for item ${itemIndex}:`, error);
      addLog(logId, `Item ${itemIndex} - ${connectedNode.label}`, 'error', `Error: ${error.message}`);
      // Stop processing this item's chain on error
      break;
    }
  }
  
  console.log(`✅ ITEM ${itemIndex}/${totalItems}: Completed processing`);
};

// Handle linear chain scenario (when we have single data to process)
const handleLinearChain = async (currentNode: WorkflowNode, data: any) => {
  let currentData = data;
  
  console.log(`🔄 LINEAR CHAIN: Processing ${currentNode.connected.length} connections`);
  
  // Process each connected node in sequence
  for (let i = 0; i < currentNode.connected.length; i++) {
    const connectedNodeId = currentNode.connected[i];
    const connectedNode = nodes.find(n => n.id === connectedNodeId);
    
    if (!connectedNode) {
      console.error(`❌ Connected node not found: ${connectedNodeId}`);
      continue;
    }

    console.log(`🔄 LINEAR: Processing ${i + 1}/${currentNode.connected.length}: ${connectedNode.label}`);
    
    try {
      const result = await executeNode(connectedNode, currentData);
      currentData = result;
      
      // Recursively process this node's connections
      if (connectedNode.connected.length > 0) {
        await executeConnectedNodes(connectedNode, currentData);
      }
      
    } catch (error: any) {
      console.error(`❌ Error in linear chain at ${connectedNode.label}:`, error);
      addLog(currentNode.id, `Linear - ${connectedNode.label}`, 'error', `Error: ${error.message}`);
      break;
    }
  }
};

// COMPLETELY REPLACE the processSingleItem function in WorkflowBuilderPage.tsx

const processSingleItem = async (
  item: any, 
  itemsToProcess: any[], 
  data: any, 
  currentNode: WorkflowNode, 
  branchLogId: string, 
  itemIndex: number, 
  totalItems: number
) => {
  console.log(`🔄 PROCESSING SINGLE ITEM - Branch ${itemIndex + 1}/${totalItems}`);
  console.log(`🔄 Current node: ${currentNode.label}, Connected nodes: ${currentNode.connected.length}`);
  console.log(`🔄 Connected node IDs:`, currentNode.connected);
  
  // Package the single item correctly for the FIRST node in the chain
  let currentData: any;
  
  if (itemsToProcess === data.papers) {
    currentData = { 
      articles: [{
        title: item.title,
        description: item.abstract,
        content: item.abstract,
        url: item.url,
        authors: item.authors,
        year: item.year,
        citations: item.citations,
        venue: item.venue
      }]
    };
  } else if (itemsToProcess === data.scrapedContent) {
    currentData = { 
      articles: [{
        title: item.url || 'Scraped Content',
        description: item.content,
        content: item.content,
        url: item.url
      }]
    };
  } else if (itemsToProcess === data.sources) {
    currentData = { 
      articles: [{
        title: item.title || 'Research Source',
        description: item.content,
        content: item.content,
        url: item.url
      }]
    };
  } else {
    currentData = { articles: [item] };
  }

  console.log(`🔄 Initial data for branch ${itemIndex + 1}:`, {
    hasArticles: !!currentData.articles,
    dataKeys: Object.keys(currentData),
    firstArticleKeys: currentData.articles?.[0] ? Object.keys(currentData.articles[0]) : []
  });

  // 🔥 CRITICAL FIX: Process ALL connected nodes in SEQUENCE
  if (currentNode.connected.length === 0) {
    console.log(`🔄 No connected nodes for ${currentNode.label}, ending branch`);
    addLog(branchLogId, `Branch ${itemIndex + 1}/${totalItems}`, 'completed', `Finished branch (no connections): "${(item.title || 'Untitled').substring(0, 50)}..."`);
    return;
  }

  // Process each connected node in sequence, passing data through the chain
  for (let nodeIndex = 0; nodeIndex < currentNode.connected.length; nodeIndex++) {
    const connectedNodeId = currentNode.connected[nodeIndex];
    const connectedNode = nodes.find(n => n.id === connectedNodeId);
    
    if (!connectedNode) {
      console.error(`🔄 Connected node not found: ${connectedNodeId}`);
      continue;
    }

    try {
      console.log(`🔄 Processing connected node ${nodeIndex + 1}/${currentNode.connected.length}: ${connectedNode.label}`);
      console.log(`🔄 Data being sent to ${connectedNode.label}:`, {
        hasProcessedContent: !!currentData.processedContent,
        hasTitle: !!currentData.title,
        hasContent: !!currentData.content,
        hasArticles: !!currentData.articles,
        dataKeys: Object.keys(currentData),
        dataPreview: JSON.stringify(currentData, null, 2).substring(0, 200)
      });

      // 🔥 SPECIAL CASE: Auto-insert AI Processor only for Publisher nodes that need it
      if (
        connectedNode.type === 'publisher' &&
        (!currentData.processedContent && !currentData.synthesizedContent && !currentData.translatedContent) &&
        (!currentData.articles?.[0]?.processedContent && !currentData.articles?.[0]?.synthesizedContent)
      ) {
        console.log('🤖 Auto-inserting AI Processor before Publisher');
        
        const tempAIProcessorNode: WorkflowNode = {
          ...connectedNode,
          id: `${connectedNode.id}-auto-ai-processor`,
          type: 'ai-processor',
          label: 'Auto AI Processor',
          config: {
            writingStyle: 'Professional',
            targetAudience: 'General readers',
            contentType: 'article',
          },
          connected: [],
        };

        // Run the AI Processor first
        const aiProcessed = await executeNode(tempAIProcessorNode, currentData);
        console.log('🤖 AI Processor result:', {
          hasTitle: !!aiProcessed.title,
          hasProcessedContent: !!aiProcessed.processedContent,
          resultKeys: Object.keys(aiProcessed)
        });
        
        // Now run the Publisher with the processed data
        const publisherResult = await executeNode(connectedNode, aiProcessed);
        currentData = publisherResult; // Update for any remaining nodes
        
      } else {
        // 🔥 NORMAL CASE: Execute the node with current data
        console.log(`🔄 Executing ${connectedNode.label} with data keys:`, Object.keys(currentData));
        const nodeResult = await executeNode(connectedNode, currentData);
        console.log(`🔄 ${connectedNode.label} completed. Result:`, {
          hasTitle: !!nodeResult.title,
          hasProcessedContent: !!nodeResult.processedContent,
          hasTranslatedContent: !!nodeResult.translatedContent,
          resultKeys: Object.keys(nodeResult),
          resultPreview: JSON.stringify(nodeResult, null, 2).substring(0, 200)
        });
        
        // 🔥 CRITICAL: Update currentData with the result for the next node
        currentData = nodeResult;
        
        // 🔥 IMPORTANT: Recursively process this node's connections
        if (connectedNode.connected.length > 0) {
          console.log(`🔄 ${connectedNode.label} has ${connectedNode.connected.length} connections, processing recursively...`);
          
          // 🔥 CRITICAL FIX: Use standard executeConnectedNodes but pass the correct data
          // We need to temporarily modify the node structure to process the chain correctly
          await executeConnectedNodes(connectedNode, currentData);
        }
      }
      
    } catch (error: any) {
      console.error(`❌ Error in ${connectedNode.label}:`, error);
      addLog(branchLogId, `Branch ${itemIndex + 1} - ${connectedNode.label}`, 'error', `Error in branch: ${error.message}`);
      
      // Stop processing this branch on error
      break;
    }
  }
  
  addLog(branchLogId, `Branch ${itemIndex + 1}/${totalItems}`, 'completed', `Finished branch for: "${(item.title || 'Untitled').substring(0, 50)}..."`);
  console.log(`✅ Branch ${itemIndex + 1} completed successfully`);
};

  const stopExecution = () => {
    setIsExecuting(false);
    toast.info('Workflow execution stopped');
  };

  const clearLogs = () => {
    setExecutionLogs([]);
  };

  const addNode = useCallback((type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: generateNodeLabel(type),
      position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
      config: {},
      connected: [],
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    toast.success(`Added ${generateNodeLabel(type)} node`);
  }, []);

  const updateNodeConfig = useCallback((nodeId: string, newConfig: Partial<WorkflowNode['config']>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, config: { ...node.config, ...newConfig } }
        : node
    ));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setNodes(prev => prev.map(node => ({
      ...node,
      connected: node.connected.filter(id => id !== nodeId)
    })));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    toast.success('Node deleted');
  }, [selectedNodeId]);

  const handleSelectNode = useCallback((node: WorkflowNode | null) => {
    setSelectedNodeId(node?.id || null);
  }, []);

  const handleConnectStart = useCallback((nodeId: string) => {
    setConnectingNodeId(nodeId);
    toast.info('Click on another node to connect');
  }, []);

  const handleConnectEnd = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      toast.error('Cannot connect a node to itself');
      setConnectingNodeId(null);
      return;
    }

    setNodes(prev => prev.map(node => 
      node.id === sourceId 
        ? { ...node, connected: [...new Set([...node.connected, targetId])] }
        : node
    ));
    setConnectingNodeId(null);
    toast.success('Nodes connected');
  }, []);

  const handleDisconnectNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, connected: [] }
        : node
    ));
    toast.success('All connections removed');
  }, []);

  const saveWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      createdAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Workflow exported successfully');
  }, [nodes]);

  const loadWorkflow = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workflowData = JSON.parse(e.target?.result as string);
            if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
              setNodes(workflowData.nodes);
              setSelectedNodeId(null);
              toast.success('Workflow imported successfully');
            } else {
              toast.error('Invalid workflow file format');
            }
          } catch (error) {
            toast.error('Failed to parse workflow file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflow Builder</h1>
            <p className="text-muted-foreground">Build automated content research and publishing workflows</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadWorkflow} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={saveWorkflow} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowLogs(!showLogs)} 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {showLogs ? 'Hide' : 'Show'} Logs
            </Button>
            {isExecuting ? (
              <Button variant="destructive" onClick={stopExecution} className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button onClick={executeWorkflow} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Run Workflow
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <WorkflowSidebar
          selectedNode={selectedNode}
          onAddNode={addNode}
          onUpdateNodeConfig={updateNodeConfig}
        />
        
        <div className="flex-1 flex">
          <div className="flex-1">
            <WorkflowCanvas
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
              onUpdateNodes={setNodes}
              onDeleteNode={deleteNode}
              connectingNodeId={connectingNodeId}
              onConnectStart={handleConnectStart}
              onConnectEnd={handleConnectEnd}
              onDisconnectNode={handleDisconnectNode}
            />
          </div>
          
          {/* Execution Logs Panel */}
          {showLogs && (
            <div className="w-80 border-l bg-muted/20 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Execution Logs</h3>
                  <Button size="sm" variant="outline" onClick={clearLogs}>
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {executionLogs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No logs yet. Run a workflow to see execution details.</p>
                ) : (
                  executionLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-2 rounded text-xs border-l-2 ${
                        log.status === 'completed' ? 'border-green-500 bg-green-50' :
                        log.status === 'error' ? 'border-red-500 bg-red-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.nodeName}</span>
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                          log.status === 'completed' ? 'bg-green-200 text-green-800' :
                          log.status === 'error' ? 'bg-red-200 text-red-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-gray-700">{log.message}</p>
                      <p className="text-gray-500 mt-1">{log.timestamp.toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;
