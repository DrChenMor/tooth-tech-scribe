
export interface ArticleStructure {
  title: string;
  subtitle?: string;
  author_name: string;
  published_date: string;
  category: string;
  excerpt: string;
  content: string;
  image_url?: string;
}

export const ARTICLE_GENERATION_PROMPT = `
You are a professional content writer creating high-quality articles. Follow this EXACT structure:

# ARTICLE STRUCTURE REQUIREMENTS:
1. **Title**: Clear, engaging main headline (30-55 characters)
2. **Subtitle** (optional): Supporting headline for context
3. **Content**: Well-structured markdown with:
   - Clear introduction paragraph
   - Multiple sections with ## headings
   - Bullet points or numbered lists where appropriate
   - Conclusion paragraph
4. **Style Guidelines**:
   - Professional but engaging tone
   - Use active voice
   - Include relevant examples
   - Break up long paragraphs
   - Use subheadings every 2-3 paragraphs

# MARKDOWN FORMAT REQUIREMENTS:
- Use # for main title (only once at the top)
- Use ## for section headings
- Use ### for subsections if needed
- Use **bold** for emphasis
- Use *italics* for quotes or foreign terms
- Use bullet points (-) or numbered lists (1.)
- Keep paragraphs 2-3 sentences max

# CONTENT QUALITY STANDARDS:
- Minimum 800 words
- Include actionable insights
- Cite sources when relevant
- End with a clear conclusion
- Ensure content flows logically

Transform the provided content following these guidelines exactly. Create a complete, publication-ready article that matches professional publishing standards.

CONTENT TO TRANSFORM:
`;

export const validateArticleStructure = (content: string): { 
  isValid: boolean; 
  issues: string[]; 
  suggestions: string[] 
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for main title
  const hasMainTitle = content.match(/^#\s+.+$/m);
  if (!hasMainTitle) {
    issues.push("Missing main title (# heading)");
  }
  
  // Check for section headings
  const sectionHeadings = content.match(/^##\s+.+$/gm);
  if (!sectionHeadings || sectionHeadings.length < 2) {
    issues.push("Article needs at least 2 section headings (## headings)");
  }
  
  // Check word count
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 300) {
    issues.push("Article is too short (minimum 300 words)");
  }
  
  // Check for proper paragraph structure
  const paragraphs = content.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
  const longParagraphs = paragraphs.filter(p => p.split(' ').length > 100);
  if (longParagraphs.length > 0) {
    suggestions.push("Consider breaking up long paragraphs for better readability");
  }
  
  // Check for conclusion
  const hasConclusion = content.toLowerCase().includes('conclusion') || 
                       content.toLowerCase().includes('in summary') ||
                       content.toLowerCase().includes('to conclude');
  if (!hasConclusion) {
    suggestions.push("Consider adding a conclusion section");
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
};

export const extractArticleMetadata = (content: string): Partial<ArticleStructure> => {
  // Extract title from first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
  
  // Extract subtitle from second # heading or first ## heading
  const subtitleMatch = content.match(/^#{1,2}\s+(.+)$/gm);
  const subtitle = subtitleMatch && subtitleMatch.length > 1 ? 
    subtitleMatch[1].replace(/^#+\s+/, '').trim() : undefined;
  
  // Generate excerpt from first paragraph after title
  const contentWithoutTitle = content.replace(/^#\s+.+$/m, '').trim();
  const firstParagraph = contentWithoutTitle.split('\n\n')[0];
  const excerpt = firstParagraph ? 
    (firstParagraph.length > 200 ? 
      firstParagraph.substring(0, 200).trim() + '...' : 
      firstParagraph.trim()) : 
    'No excerpt available';
  
  return {
    title,
    subtitle,
    excerpt,
    content
  };
};
