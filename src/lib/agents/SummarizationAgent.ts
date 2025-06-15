
import { BaseAgent, AgentSuggestion, AgentAnalysisContext } from './BaseAgent';

export class SummarizationAgent extends BaseAgent {
  async analyze(context: AgentAnalysisContext): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    const { articles = [] } = context;

    // Enhanced article filtering with quality scoring
    const articlesWithMetrics = articles
      .filter(article => article.status === 'published')
      .map(article => ({
        ...article,
        metrics: this.generateComprehensiveMetrics(article, articles),
        needs_summary: this.assessSummaryNeed(article)
      }))
      .filter(article => article.needs_summary.required)
      .sort((a, b) => b.needs_summary.priority_score - a.needs_summary.priority_score)
      .slice(0, 5);

    for (const article of articlesWithMetrics) {
      if (article.content && article.content.length > 200) {
        const analysisResult = this.performAdvancedContentAnalysis(article);
        
        const confidenceFactors = [
          article.needs_summary.priority_score,
          article.metrics.quality_score,
          analysisResult.content_complexity > 0.6 ? 0.9 : 0.7,
          !article.excerpt ? 0.95 : 0.7
        ];

        suggestions.push({
          target_type: 'article',
          target_id: article.id.toString(),
          suggestion_data: {
            excerpt: analysisResult.suggested_summary,
            suggested_tags: analysisResult.suggested_tags,
            current_excerpt: article.excerpt || '',
            article_title: article.title,
            content_analysis: {
              complexity_score: analysisResult.content_complexity,
              readability_score: analysisResult.readability_score,
              key_topics: analysisResult.key_topics,
              word_count: analysisResult.word_count,
              estimated_read_time: analysisResult.estimated_read_time
            },
            seo_improvements: analysisResult.seo_recommendations
          },
          reasoning: this.generateEnhancedReasoning(article, analysisResult),
          confidence_score: this.generateConfidenceScore(confidenceFactors),
          priority: this.calculatePriority(
            article.needs_summary.urgency,
            0.7,
            this.generateConfidenceScore(confidenceFactors)
          ),
        });
      }
    }

    return suggestions;
  }

  private assessSummaryNeed(article: any): { required: boolean; priority_score: number; urgency: number } {
    let priority_score = 0;
    let urgency = 0.5; // Base urgency

    // No excerpt at all
    if (!article.excerpt) {
      priority_score += 0.4;
      urgency += 0.3;
    }
    // Very short excerpt
    else if (article.excerpt.length < 50) {
      priority_score += 0.3;
      urgency += 0.2;
    }
    // Sub-optimal excerpt length for SEO
    else if (article.excerpt.length < 120 || article.excerpt.length > 160) {
      priority_score += 0.2;
      urgency += 0.1;
    }

    // Content length factor
    const contentLength = article.content?.length || 0;
    if (contentLength > 2000) {
      priority_score += 0.3;
      urgency += 0.2;
    } else if (contentLength > 1000) {
      priority_score += 0.2;
      urgency += 0.1;
    }

    // Recent articles get higher priority
    const ageInDays = Math.floor((Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays < 7) {
      priority_score += 0.1;
      urgency += 0.1;
    }

    return {
      required: priority_score > 0.2,
      priority_score: Math.min(1, priority_score),
      urgency: Math.min(1, urgency)
    };
  }

  private performAdvancedContentAnalysis(article: any) {
    const content = article.content || '';
    const title = article.title || '';
    
    // Advanced content analysis
    const wordCount = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      suggested_summary: this.generateAdvancedSummary(content, title),
      suggested_tags: this.generateSmartTags(title, content),
      content_complexity: this.calculateContentComplexity(content, sentences, paragraphs),
      readability_score: this.calculateReadabilityScore(content, sentences, wordCount),
      key_topics: this.extractKeyTopics(content, title),
      word_count: wordCount,
      estimated_read_time: Math.ceil(wordCount / 200),
      seo_recommendations: this.generateSEORecommendations(article)
    };
  }

  private generateAdvancedSummary(content: string, title: string): string {
    // Enhanced extractive summarization
    const sentences = content.split(/[.!?]+/)
      .filter(s => s.trim().length > 20)
      .map(s => s.trim());
    
    if (sentences.length === 0) return '';

    // Score sentences based on position, length, and keyword relevance
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position scoring (beginning sentences are more important)
      if (index < 3) score += 0.3;
      else if (index < sentences.length * 0.3) score += 0.2;
      
      // Length scoring (avoid too short or too long sentences)
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount >= 10 && wordCount <= 25) score += 0.2;
      
      // Title keyword relevance
      const titleWords = title.toLowerCase().split(/\s+/);
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const overlap = titleWords.filter(word => 
        sentenceWords.some(sw => sw.includes(word) && word.length > 3)
      ).length;
      score += (overlap / titleWords.length) * 0.3;
      
      return { sentence, score, index };
    });

    // Select best sentences for summary
    const selectedSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);

    const summary = selectedSentences.join('. ') + '.';
    
    // Ensure optimal length for SEO (120-160 chars)
    if (summary.length > 160) {
      return summary.substring(0, 157) + '...';
    } else if (summary.length < 120 && selectedSentences.length > 1) {
      // Try to expand if too short
      return summary;
    }
    
    return summary;
  }

  private generateSmartTags(title: string, content: string): string[] {
    const text = (title + ' ' + content).toLowerCase();
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
      'her', 'its', 'our', 'their', 'can', 'may', 'might', 'must', 'shall', 'up', 'down',
      'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
    ]);
    
    // Extract words and calculate frequency with position weighting
    const words = text.match(/\b\w{3,}\b/g) || [];
    const frequency: Record<string, number> = {};
    const positionWeight: Record<string, number> = {};
    
    words.forEach((word, index) => {
      if (!stopWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
        
        // Give higher weight to words appearing early (title and beginning)
        const weight = index < 50 ? 2 : (index < 200 ? 1.5 : 1);
        positionWeight[word] = Math.max(positionWeight[word] || 0, weight);
      }
    });
    
    // Calculate final scores combining frequency and position
    const scoredWords = Object.entries(frequency)
      .map(([word, freq]) => ({
        word,
        score: freq * (positionWeight[word] || 1)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.word);
    
    return scoredWords;
  }

  private calculateContentComplexity(content: string, sentences: string[], paragraphs: string[]): number {
    // Flesch-Kincaid inspired complexity calculation
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences.length;
    const avgSentencesPerParagraph = sentences.length / paragraphs.length;
    
    // Complexity factors
    let complexity = 0;
    
    // Sentence length factor
    if (avgWordsPerSentence > 20) complexity += 0.3;
    else if (avgWordsPerSentence > 15) complexity += 0.2;
    else complexity += 0.1;
    
    // Paragraph structure factor
    if (avgSentencesPerParagraph > 5) complexity += 0.2;
    else if (avgSentencesPerParagraph > 3) complexity += 0.1;
    
    // Vocabulary complexity (simplified)
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
    const lexicalDiversity = uniqueWords / words;
    complexity += lexicalDiversity * 0.3;
    
    return Math.min(1, complexity);
  }

  private calculateReadabilityScore(content: string, sentences: string[], wordCount: number): number {
    // Simplified readability score (higher = more readable)
    const avgWordsPerSentence = wordCount / sentences.length;
    
    let readability = 1;
    
    // Penalize very long sentences
    if (avgWordsPerSentence > 25) readability -= 0.3;
    else if (avgWordsPerSentence > 20) readability -= 0.2;
    else if (avgWordsPerSentence < 8) readability -= 0.1;
    
    return Math.max(0, Math.min(1, readability));
  }

  private extractKeyTopics(content: string, title: string): string[] {
    // Simple topic extraction based on noun phrases and frequent terms
    const text = title + ' ' + content;
    const topics = [];
    
    // Look for capitalized words (potential proper nouns/topics)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const topicCandidates = [...new Set(capitalizedWords)]
      .filter(topic => topic.length > 3 && !['The', 'This', 'That', 'And', 'But'].includes(topic))
      .slice(0, 5);
    
    topics.push(...topicCandidates);
    
    return topics;
  }

  private generateSEORecommendations(article: any): string[] {
    const recommendations = [];
    
    if (!article.excerpt || article.excerpt.length < 120) {
      recommendations.push('Add meta description (120-160 characters)');
    }
    
    if (!article.image_url) {
      recommendations.push('Add featured image for better social sharing');
    }
    
    const titleLength = article.title?.length || 0;
    if (titleLength < 30 || titleLength > 60) {
      recommendations.push('Optimize title length (30-60 characters)');
    }
    
    if (!article.category) {
      recommendations.push('Assign appropriate category for better organization');
    }
    
    return recommendations;
  }

  private generateEnhancedReasoning(article: any, analysis: any): string {
    const reasons = [];
    
    if (!article.excerpt) {
      reasons.push('missing excerpt');
    } else if (article.excerpt.length < 50) {
      reasons.push('very short excerpt');
    }
    
    reasons.push(`content complexity score: ${Math.round(analysis.content_complexity * 100)}%`);
    reasons.push(`${analysis.word_count} words (~${analysis.estimated_read_time} min read)`);
    
    if (analysis.seo_recommendations.length > 0) {
      reasons.push(`${analysis.seo_recommendations.length} SEO improvements identified`);
    }
    
    return `Article "${article.title}" analysis: ${reasons.join(', ')}. Enhanced summarization will improve discoverability and user engagement with optimized meta description and smart tag suggestions.`;
  }

  explainReasoning(suggestion: AgentSuggestion): string {
    return `Advanced content analysis identified opportunities for improved summarization using multi-factor scoring including content complexity, readability metrics, and SEO optimization potential.`;
  }
}
