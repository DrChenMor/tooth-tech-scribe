
import { WorkflowNode } from '@/pages/WorkflowBuilderPage';
import { validateArticleStructure, extractArticleMetadata } from '@/lib/articleStructureTemplate';

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

export const executeArticleValidation = async (
  node: WorkflowNode, 
  previousData: any
): Promise<ArticleValidationResult> => {
  if (!previousData || (!previousData.processedContent && !previousData.synthesizedContent)) {
    throw new Error('No content to validate. Connect this node to a content processor.');
  }

  const content = previousData.processedContent || previousData.synthesizedContent;
  
  // Validate article structure
  const validation = validateArticleStructure(content);
  
  // Extract metadata
  const metadata = extractArticleMetadata(content);
  
  // Calculate word count and sections
  const wordCount = content.split(/\s+/).length;
  const sectionHeadings = content.match(/^##\s+.+$/gm) || [];
  const hasConclusion = content.toLowerCase().includes('conclusion') || 
                       content.toLowerCase().includes('in summary') ||
                       content.toLowerCase().includes('to conclude');

  // Calculate overall score
  let score = 100;
  score -= validation.issues.length * 15; // Each issue reduces score by 15 points
  score -= validation.suggestions.length * 5; // Each suggestion reduces score by 5 points
  score = Math.max(0, Math.min(100, score)); // Clamp between 0-100

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
