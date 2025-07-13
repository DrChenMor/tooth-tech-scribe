import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface SEOBreakdownProps {
  seoScore: number;
  seoDetails: any;
  title: string;
  children: React.ReactNode;
}

const SEOBreakdownModal: React.FC<SEOBreakdownProps> = ({ seoScore, seoDetails, title, children }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (seoDetails?.title_analysis?.status === 'needs_improvement') {
      recommendations.push('Title length should be between 30-60 characters');
    }
    
    if (seoDetails?.content_analysis?.status === 'too_short') {
      recommendations.push('Content should be at least 300 words');
    }
    
    if (seoDetails?.structure?.status === 'no_headings') {
      recommendations.push('Add more headings to improve structure');
    }
    
    if (seoDetails?.readability?.status === 'complex') {
      recommendations.push('Simplify sentences for better readability');
    }
    
    return recommendations;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            SEO Analysis for: {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Overall SEO Score
                {getScoreIcon(seoScore)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold" style={{ color: seoScore >= 80 ? '#16a34a' : seoScore >= 60 ? '#ca8a04' : '#dc2626' }}>
                  {seoScore}/100
                </div>
                <div className="flex-1">
                  <Progress value={seoScore} className="h-3" />
                </div>
                <Badge variant={seoScore >= 80 ? 'default' : seoScore >= 60 ? 'secondary' : 'destructive'}>
                  {seoScore >= 80 ? 'Excellent' : seoScore >= 60 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Title Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Length:</span>
                  <span className="font-medium">{seoDetails?.title_analysis?.length || 0} characters</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge variant={
                    seoDetails?.title_analysis?.status === 'optimal' ? 'default' :
                    seoDetails?.title_analysis?.status === 'good' ? 'secondary' : 'destructive'
                  }>
                    {seoDetails?.title_analysis?.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Optimal: {seoDetails?.title_analysis?.optimal_range || '30-60 characters'}
                </div>
              </CardContent>
            </Card>

            {/* Content Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Word Count:</span>
                  <span className="font-medium">{seoDetails?.content_analysis?.word_count || 0} words</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge variant={
                    seoDetails?.content_analysis?.status === 'optimal' ? 'default' :
                    seoDetails?.content_analysis?.status === 'good' ? 'secondary' : 'destructive'
                  }>
                    {seoDetails?.content_analysis?.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {seoDetails?.content_analysis?.optimal_count || '300+ words'}
                </div>
              </CardContent>
            </Card>

            {/* Structure Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Structure Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Headings:</span>
                  <span className="font-medium">{seoDetails?.structure?.heading_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge variant={
                    seoDetails?.structure?.status === 'excellent' ? 'default' :
                    seoDetails?.structure?.status === 'good' ? 'secondary' : 'destructive'
                  }>
                    {seoDetails?.structure?.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {seoDetails?.structure?.optimal_count || '3+ headings'}
                </div>
              </CardContent>
            </Card>

            {/* Readability Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Readability Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Avg Words/Sentence:</span>
                  <span className="font-medium">{seoDetails?.readability?.avg_words_per_sentence || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge variant={
                    seoDetails?.readability?.status === 'excellent' ? 'default' :
                    seoDetails?.readability?.status === 'good' ? 'secondary' : 'destructive'
                  }>
                    {seoDetails?.readability?.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {seoDetails?.readability?.optimal_range || '15-20 words per sentence'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {getRecommendations().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {getRecommendations().map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Detailed Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Title Score:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{seoDetails?.title_analysis?.score || 0}/25</span>
                    <Progress value={(seoDetails?.title_analysis?.score || 0) * 4} className="w-20 h-2" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>Content Score:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{seoDetails?.content_analysis?.score || 0}/25</span>
                    <Progress value={(seoDetails?.content_analysis?.score || 0) * 4} className="w-20 h-2" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>Structure Score:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{seoDetails?.structure?.score || 0}/25</span>
                    <Progress value={(seoDetails?.structure?.score || 0) * 4} className="w-20 h-2" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>Readability Score:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{seoDetails?.readability?.score || 0}/25</span>
                    <Progress value={(seoDetails?.readability?.score || 0) * 4} className="w-20 h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SEOBreakdownModal; 