import { WorkflowNode } from '@/types/WorkflowTypes';

export interface ArticleValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  metadata: {
    title: string;
    subtitle?: string;
    excerpt: string;
    wordCount: number;
    sectionCount: number;
    hasConclusion: boolean;
  };
}

// Enhanced validation functions
const validateArticleStructure = (content: string, minWordCount: number = 300, requireConclusion: boolean = true) => {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check word count
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < minWordCount) {
    issues.push(`Article is too short (${wordCount} words). Minimum recommended: ${minWordCount} words.`);
  }

  // Check for proper headings
  const headings = content.match(/^#+\s+.+$/gm) || [];
  if (headings.length === 0) {
    issues.push('No headings found. Articles should have clear section headings.');
  } else if (headings.length < 2) {
    suggestions.push('Consider adding more section headings to improve readability.');
  }

  // Check for H1 title (should be avoided in content since title is separate)
  const h1Headings = content.match(/^#\s+.+$/gm) || [];
  if (h1Headings.length > 0) {
    suggestions.push('Remove H1 headings (#) from content. Use H2 (##) and below for sections.');
  }

  // Check for conclusion
  if (requireConclusion) {
    const hasConclusion = content.toLowerCase().includes('conclusion') || 
                         content.toLowerCase().includes('in summary') ||
                         content.toLowerCase().includes('to conclude') ||
                         content.toLowerCase().includes('final thoughts') ||
                         content.toLowerCase().includes('wrap up');
    
    if (!hasConclusion) {
      suggestions.push('Consider adding a conclusion section to summarize key points.');
    }
  }

  // Check for introduction
  const contentLines = content.split('\n').filter(line => line.trim());
  const firstParagraph = contentLines.find(line => !line.startsWith('#') && line.length > 50);
  if (!firstParagraph) {
    suggestions.push('Add a clear introduction paragraph to engage readers.');
  }

  // Check for proper formatting
  if (!content.includes('**') && !content.includes('*')) {
    suggestions.push('Consider using bold or italic formatting to emphasize important points.');
  }

  // Check for lists
  if (!content.includes('-') && !content.includes('1.') && !content.includes('*')) {
    suggestions.push('Consider using bullet points or numbered lists to improve readability.');
  }

  // Check paragraph length
  const paragraphs = content.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
  const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 100);
  if (longParagraphs.length > 0) {
    suggestions.push('Some paragraphs are very long. Consider breaking them into smaller chunks.');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
};

const extractArticleMetadata = (content: string) => {
  // Extract title (first H1 or H2)
  const titleMatch = content.match(/^#+\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract subtitle (second heading if exists)
  const headings = content.match(/^#+\s+.+$/gm) || [];
  const subtitle = headings.length > 1 ? headings[1].replace(/^#+\s+/, '').trim() : undefined;

  // Extract excerpt (first paragraph that's not a heading)
  const contentLines = content.split('\n').filter(line => line.trim());
  const firstParagraph = contentLines.find(line => !line.startsWith('#') && line.length > 20);
  const excerpt = firstParagraph ? 
    (firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + '...' : firstParagraph) : '';

  return {
    title,
    subtitle,
    excerpt
  };
};

export const executeArticleValidation = async (
  node: WorkflowNode, 
  previousData: any
): Promise<ArticleValidationResult> => {
  if (!previousData || (!previousData.processedContent && !previousData.synthesizedContent)) {
    throw new Error('No content to validate. Connect this node to a content processor.');
  }

  const content = previousData.processedContent || previousData.synthesizedContent;
  
  // Get configuration from node
  const minWordCount = node.config.minWordCount || 300;
  const requireConclusion = node.config.requireConclusion !== false;
  
  // Validate article structure
  const validation = validateArticleStructure(content, minWordCount, requireConclusion);
  
  // Extract metadata
  const metadata = extractArticleMetadata(content);
  
  // Calculate word count and sections
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const sectionHeadings = content.match(/^##\s+.+$/gm) || [];
  const hasConclusion = content.toLowerCase().includes('conclusion') || 
                       content.toLowerCase().includes('in summary') ||
                       content.toLowerCase().includes('to conclude') ||
                       content.toLowerCase().includes('final thoughts');

  // Calculate overall score with more sophisticated scoring
  let score = 100;
  
  // Deduct points for issues (major problems)
  score -= validation.issues.length * 15;
  
  // Deduct fewer points for suggestions (minor improvements)
  score -= validation.suggestions.length * 5;
  
  // Bonus points for good practices
  if (wordCount >= minWordCount * 1.5) score += 5; // Bonus for longer content
  if (sectionHeadings.length >= 3) score += 5; // Bonus for good structure
  if (hasConclusion) score += 5; // Bonus for conclusion
  if (content.includes('**') || content.includes('*')) score += 3; // Bonus for formatting
  if (content.includes('-') || content.includes('1.')) score += 3; // Bonus for lists
  
  // Clamp score between 0-100
  score = Math.max(0, Math.min(100, score));

  const result: ArticleValidationResult = {
    isValid: validation.isValid,
    score,
    issues: validation.issues,
    suggestions: validation.suggestions,
    metadata: {
      title: metadata.title || 'Untitled',
      subtitle: metadata.subtitle,
      excerpt: metadata.excerpt || '',
      wordCount,
      sectionCount: sectionHeadings.length,
      hasConclusion
    }
  };

  return result;
};
