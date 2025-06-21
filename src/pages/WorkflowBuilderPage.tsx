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

const WorkflowBuilderPage = () => {
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
              scrapedContent.push({ url, content: data.content });
              addLog(node.id, node.label, 'completed', `Scraped content from ${url}`);
            } catch (error) {
              addLog(node.id, node.label, 'error', `Failed to scrape ${url}: ${error.message}`);
            }
          }
          result = { scrapedContent, urls: node.config.urls };
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
              includeAbstracts: node.config.includeAbstracts
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

        case 'image-generator':
          console.log('🎨 IMAGE GENERATOR: Starting execution');
          console.log('🎨 NODE CONFIG:', JSON.stringify(node.config, null, 2));
          console.log('🎨 PREVIOUS DATA:', JSON.stringify(previousData, null, 2));
          
          // Priority: Custom imagePrompt → Custom instructions → Title-based generation
          let imagePrompt = '';
          
          // First priority: Custom image prompt
          if (node.config.imagePrompt && node.config.imagePrompt.trim()) {
            imagePrompt = node.config.imagePrompt.trim();
            console.log('🎨 USING CUSTOM IMAGE PROMPT:', imagePrompt);
            addLog(node.id, node.label, 'running', 'Using custom image prompt');
          }
          // Second priority: Custom instructions as prompt
          else if (node.config.customInstructions && node.config.customInstructions.trim()) {
            imagePrompt = node.config.customInstructions.trim();
            console.log('🎨 USING CUSTOM INSTRUCTIONS AS PROMPT:', imagePrompt);
            addLog(node.id, node.label, 'running', 'Using custom instructions as image prompt');
          }
          // Third priority: Generate from title
          else if (previousData && previousData.title) {
            imagePrompt = `Professional illustration representing: ${previousData.title}`;
            console.log('🎨 USING TITLE-BASED PROMPT:', imagePrompt);
            addLog(node.id, node.label, 'running', 'Generating image based on article title');
          }
          // Fallback: Generic prompt
          else {
            imagePrompt = 'Professional illustration for a news or informational article';
            console.log('🎨 USING FALLBACK PROMPT:', imagePrompt);
            addLog(node.id, node.label, 'running', 'Using fallback image prompt');
          }
          
          // Add custom instructions to enhance the prompt (if not already used as main prompt)
          if (node.config.customInstructions && node.config.customInstructions !== imagePrompt) {
            imagePrompt += `. ${node.config.customInstructions}`;
            console.log('🎨 ENHANCED PROMPT WITH CUSTOM INSTRUCTIONS:', imagePrompt);
          }
          
          console.log('🎨 FINAL IMAGE PROMPT:', imagePrompt);
          console.log('🎨 AI MODEL SELECTED:', node.config.aiModel || 'default');
          console.log('🎨 IMAGE STYLE:', node.config.imageStyle || 'natural');
          console.log('🎨 IMAGE SIZE:', node.config.imageSize || '1024x1024');
          console.log('🎨 IMAGE QUALITY:', node.config.imageQuality || 'standard');
          
          addLog(node.id, node.label, 'running', `Generating image with ${node.config.aiModel || 'default model'}: "${imagePrompt.substring(0, 100)}..."`);
          
          const imagePayload = {
            prompt: imagePrompt,
            aiModel: node.config.aiModel || 'dall-e-3',
            style: node.config.imageStyle || 'natural',
            size: node.config.imageSize || '1024x1024',
            quality: node.config.imageQuality || 'standard',
            customInstructions: node.config.customInstructions
          };
          
          console.log('🎨 SENDING TO IMAGE GENERATOR:', JSON.stringify(imagePayload, null, 2));
          
          const { data: imageData, error: imageError } = await supabase.functions.invoke('image-generator', {
            body: imagePayload
          });
          
          if (imageError) {
            console.error('🎨 IMAGE GENERATOR ERROR:', imageError);
            throw new Error(imageError.message);
          }
          
          console.log('🎨 IMAGE GENERATOR RESPONSE:', JSON.stringify(imageData, null, 2));
          
          result = { 
            ...previousData, // Pass through previous data including title
            imageUrl: imageData.imageUrl,
            imagePrompt: imagePrompt,
            imageStyle: node.config.imageStyle,
            imageSize: node.config.imageSize,
            aiModelUsed: node.config.aiModel,
            wasImageReused: imageData.wasReused || false
          };
          
          if (imageData.wasReused) {
            console.log('🎨 IMAGE WAS REUSED FROM CACHE');
            addLog(node.id, node.label, 'completed', `Image reused from previous generation (${imageData.generatedWith})`);
          } else {
            console.log('🎨 NEW IMAGE GENERATED');
            addLog(node.id, node.label, 'completed', `New image generated with ${imageData.generatedWith}`);
          }
          break;
          
        case 'seo-analyzer':
          if (!previousData || (!previousData.processedContent && !previousData.synthesizedContent)) {
            throw new Error('No content to analyze for SEO. Connect this node to content sources.');
          }
          
          const contentToAnalyze = previousData.processedContent || previousData.synthesizedContent;
          const titleToAnalyze = previousData.title || 'Untitled';
          
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
            ...previousData, // Pass through previous data
            seoAnalysis: seoData.analysis,
            seoScore: seoData.analysis.seo_score,
            seoSuggestions: seoData.analysis.improvements
          };
          addLog(node.id, node.label, 'completed', `SEO analysis completed. Score: ${seoData.analysis.seo_score}/100`);
          break;
          
        case 'multi-source-synthesizer':
          // Enhanced input handling - accept various data formats
          let sources = [];
          
          if (previousData) {
            if (previousData.scrapedContent && Array.isArray(previousData.scrapedContent)) {
              sources.push(...previousData.scrapedContent.map((item: any) => ({
                title: item.url || 'Scraped Content',
                url: item.url || '',
                content: item.content || ''
              })));
            }
            
            if (previousData.articles && Array.isArray(previousData.articles)) {
              sources.push(...previousData.articles.map((item: any) => ({
                title: item.title || 'Article',
                url: item.link || item.url || '',
                content: item.description || item.content || item.summary || ''
              })));
            }
            
            if (previousData.papers && Array.isArray(previousData.papers)) {
              sources.push(...previousData.papers.map((item: any) => ({
                title: item.title || 'Research Paper',
                url: item.url || '',
                content: item.abstract || item.content || ''
              })));
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
          
          result = { 
            synthesizedContent: synthData.synthesizedContent,
            sourceCount: synthData.sourceCount,
            style: synthData.style
          };
          addLog(node.id, node.label, 'completed', `Synthesized content from ${synthData.sourceCount} sources`);
          break;

        case 'ai-processor':
          try {
            console.log('AI Processor: Processing content...');
            
            // Get the content to process from previous data
            const contentToProcess = previousData || {};
            
            // Build enhanced prompt for better content generation
            const contentType = node.config.contentType || 'article';
            const writingStyle = node.config.writingStyle || 'Professional';
            const targetAudience = node.config.targetAudience || 'General readers';
            const category = node.config.category || 'General';
            const customInstructions = node.config.customInstructions || '';
            
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
            
            const enhancedPrompt = `
You are an expert content writer. Create a ${contentType} based on the following content.

**Content Type**: ${contentType}
**Writing Style**: ${writingStyle}
**Target Audience**: ${targetAudience}
**Category**: ${category}

${customInstructions ? `**Additional Instructions**: ${customInstructions}` : ''}

**CRITICAL FORMATTING RULES:**
- Start with a clear, engaging title as an H1 heading using # (not ** for bold)
- Use proper markdown formatting: # for main title, ## for sections, ### for subsections
- NO bold titles (**title**) - only use # Title format
- Create engaging, well-structured content suitable for publication
- Include relevant subheadings to organize the content (##, ###)
- Ensure the content is informative and valuable to the target audience
- Use lists, emphasis, and proper paragraph structure
- The title should be descriptive and engaging, not generic

**Example of proper format:**
# Engaging Article Title Here

Brief introduction paragraph...

## First Section Heading

Content for first section...

## Second Section Heading

Content for second section...

**Source Content to Transform:**
${sourceContent}

Generate the ${contentType} now with proper markdown formatting:`;

            const agentConfig = {
              ai_model: node.config.aiModel || 'gemini-2.5-flash-preview-05-20',
              provider: node.config.aiModel?.startsWith('gemini-') ? 'Google' : 
                     node.config.aiModel?.startsWith('gpt-') ? 'OpenAI' : 
                     node.config.aiModel?.startsWith('claude-') ? 'Anthropic' : 'Google'
            };

            const { data: aiResult, error: aiError } = await supabase.functions.invoke('run-ai-agent-analysis', {
              body: { prompt: enhancedPrompt, agentConfig }
            });

            if (aiError) {
              throw new Error(`AI processing failed: ${aiError.message}`);
            }

            let processedContent = aiResult.analysis;
            
            // Clean any potential JSON formatting that might have slipped through
            if (processedContent.includes('```') || processedContent.trim().startsWith('{')) {
              // Extract clean content if wrapped in code blocks or JSON
              processedContent = processedContent
                .replace(/```(?:json|markdown)?\s*/g, '')
                .replace(/```\s*$/g, '')
                .trim();
                
              // If it's JSON, try to extract the content field
              if (processedContent.startsWith('{')) {
                try {
                  const parsed = JSON.parse(processedContent);
                  processedContent = parsed.content || parsed.text || processedContent;
                } catch (e) {
                  // If JSON parsing fails, use as-is
                  console.log('Could not parse as JSON, using raw content');
                }
              }
            }

            // Extract the title from the markdown
            const titleMatch = processedContent.match(/^#\s+(.+)/m);
            const extractedTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
            
            // ✅ CRITICAL FIX: Remove the title line from the content
            let contentWithoutTitle = processedContent;
            if (titleMatch) {
              contentWithoutTitle = processedContent.replace(/^#\s+.+$/m, '').trim();
              console.log('✅ AI Processor: Removed title from content to prevent duplication');
            }

            // Ensure content starts with a proper title if it doesn't have one
            if (!processedContent.trim().startsWith('#')) {
              const lines = processedContent.split('\n');
              const firstMeaningfulLine = lines.find(line => line.trim().length > 10) || 'Generated Article';
              processedContent = `# ${firstMeaningfulLine}\n\n${processedContent}`;
              // Extract title again after adding it
              const newTitleMatch = processedContent.match(/^#\s+(.+)/m);
              if (newTitleMatch) {
                contentWithoutTitle = processedContent.replace(/^#\s+.+$/m, '').trim();
              }
            }
            
            console.log('AI Processor: Content generated successfully, title:', extractedTitle);
            console.log('AI Processor: Content length with title:', processedContent.length);
            console.log('AI Processor: Content length without title:', contentWithoutTitle.length);
            
            result = {
              ...contentToProcess,
              title: extractedTitle, // ✅ FIXED: Properly extract and pass title
              content: contentWithoutTitle, // ✅ FIXED: Use content WITHOUT title
              processedContent: contentWithoutTitle, // ✅ FIXED: Use content WITHOUT title
              processedBy: `AI Processor (${agentConfig.ai_model})`,
              category: category,
              contentType: contentType,
              writingStyle: writingStyle,
              targetAudience: targetAudience
            };
            
            addLog(node.id, node.label, 'completed', `Content processed successfully with title: "${extractedTitle}"`);
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
          // ✅ FIXED: Use the title from previous data (AI Processor now provides it)
          const titleToPublish = previousData.title || 'Untitled Article';
          
          // Get image URL from previous nodes (Image Generator)
          const articleImageUrl = previousData.imageUrl || null;
          
          // Use English slug if available (from translator), otherwise create one
          let slugToUse = '';
          if (previousData.englishSlug) {
            // Use the English slug from translator
            slugToUse = previousData.englishSlug;
          } else {
            // ✅ FIXED: Create English slug from the properly extracted title
            slugToUse = titleToPublish
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '')
              .trim();
          }
          
          addLog(node.id, node.label, 'running', `Publishing article: "${titleToPublish}" with slug: ${slugToUse}${articleImageUrl ? ' (with featured image)' : ''}`);
          
          // Create a properly formatted content for the publisher
          const formattedContent = {
            title: titleToPublish,
            content: contentToPublish,
            slug: slugToUse, // Force English slug
            image_url: articleImageUrl, // Include featured image
            isRTL: previousData.isRTL || false, // Pass RTL info
            targetLanguage: previousData.targetLanguage || 'en'
          };
          
          // Use the create-article-from-ai edge function for proper article creation
          const { data: publishResult, error: publishError } = await supabase.functions.invoke('create-article-from-ai', {
            body: {
              content: JSON.stringify(formattedContent),
              category: node.config.category || previousData.category || 'AI Generated',
              provider: previousData.aiModel || 'AI Processor',
              status: node.config.status || 'draft'
            }
          });

          if (publishError) throw new Error(publishError.message);
          
          result = { 
            articleId: publishResult.article.id,
            title: publishResult.article.title,
            slug: publishResult.article.slug,
            status: publishResult.article.status,
            imageUrl: articleImageUrl, // Pass through image URL
            url: `/articles/${publishResult.article.slug}`
          };
          addLog(node.id, node.label, 'completed', `Article published: "${publishResult.article.title}" (${publishResult.article.status})${articleImageUrl ? ' with featured image' : ''}`);
          break;
          
        case 'email-sender':
          if (!node.config.recipient || !node.config.subject) {
            throw new Error('Email recipient and subject are required');
          }
          
          // Use previous data to build email content
          const emailBody = node.config.body || 
            (previousData?.title ? `New article published: ${previousData.title}` : 'Workflow execution completed');
          
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              to: node.config.recipient,
              subject: node.config.subject,
              body: emailBody
            }
          });
          if (emailError) throw new Error(emailError.message);
          
          result = { emailSent: true, recipient: node.config.recipient };
          addLog(node.id, node.label, 'completed', `Email sent to ${node.config.recipient}`);
          break;

        case 'translator':
          if (!previousData || (!previousData.processedContent && !previousData.synthesizedContent && !previousData.content)) {
            throw new Error('No content to translate. Connect this node to a content source.');
          }
          
          // Get content to translate - try multiple sources
          const contentToTranslate = previousData.processedContent || 
                                    previousData.synthesizedContent || 
                                    previousData.content ||
                                    '';
          
          // Get title to translate if it exists
          const titleToTranslate = previousData.title || '';
          
          if (!contentToTranslate && !titleToTranslate) {
            throw new Error('No content found to translate.');
          }
          
          addLog(node.id, node.label, 'running', `Translating content to ${node.config.targetLanguage || 'es'}`);
          
          let translatedContent = contentToTranslate;
          let translatedTitle = titleToTranslate;
          
          // Translate content if it exists
          if (contentToTranslate) {
            const { data: contentTranslation, error: contentError } = await supabase.functions.invoke('translator', {
              body: {
                content: contentToTranslate,
                targetLanguage: node.config.targetLanguage || 'es',
                provider: node.config.provider || 'google'
              }
            });
            if (contentError) throw new Error(`Content translation failed: ${contentError.message}`);
            translatedContent = contentTranslation.content;
          }
          
          // Translate title if it exists
          if (titleToTranslate) {
            const { data: titleTranslation, error: titleError } = await supabase.functions.invoke('translator', {
              body: {
                content: titleToTranslate,
                targetLanguage: node.config.targetLanguage || 'es',
                provider: node.config.provider || 'google'
              }
            });
            if (titleError) {
              console.warn('Title translation failed, using original title');
              translatedTitle = titleToTranslate;
            } else {
              translatedTitle = titleTranslation.content;
            }
          }
          
          // Create English slug from ORIGINAL title (before translation!)
          const englishSlugBase = previousData.title || titleToTranslate || 'translated-article';
          let englishSlug = englishSlugBase
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove non-English characters
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .trim();
          
          // If slug is empty (all non-English), create a meaningful fallback
          if (!englishSlug || englishSlug.length < 3) {
            const targetLang = node.config.targetLanguage || 'translated';
            const timestamp = Date.now().toString().slice(-6); // Last 6 digits
            englishSlug = `${targetLang}-article-${timestamp}`;
          }
          
          // Detect if target language is RTL
          const rtlLanguages = ['he', 'ar', 'fa', 'ur']; // Hebrew, Arabic, Persian, Urdu
          const isRTL = rtlLanguages.includes(node.config.targetLanguage || 'es');
          
          result = { 
            title: translatedTitle,
            processedContent: translatedContent,
            translatedContent: translatedContent,
            translatedTitle: translatedTitle,
            englishSlug: englishSlug, // Always has a valid English slug!
            targetLanguage: node.config.targetLanguage,
            isRTL: isRTL,
            originalContent: contentToTranslate,
            originalTitle: titleToTranslate,
            category: previousData.category,
            aiModel: previousData.aiModel
          };
          addLog(node.id, node.label, 'completed', `Translated to ${node.config.targetLanguage} with slug: ${englishSlug}`);
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

  const executeConnectedNodes = async (currentNode: WorkflowNode, data: any) => {
    for (const connectedNodeId of currentNode.connected) {
      const connectedNode = nodes.find(n => n.id === connectedNodeId);
      if (connectedNode) {
        try {
          const result = await executeNode(connectedNode, data);
          // Recursively execute the next connected nodes
          await executeConnectedNodes(connectedNode, result);
        } catch (error) {
          // Log error but continue with other nodes
          console.error(`Error executing node ${connectedNode.label}:`, error);
        }
      }
    }
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
