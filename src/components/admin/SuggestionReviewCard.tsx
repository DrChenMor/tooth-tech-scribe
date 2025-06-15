
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertTriangle, Clock, Brain } from 'lucide-react';
import { updateSuggestionStatus } from '@/services/aiAgents';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface SuggestionReviewCardProps {
  suggestion: {
    id: string;
    agent_id: string | null;
    target_type: string;
    target_id: string | null;
    suggestion_data: Record<string, any>;
    reasoning: string;
    status: 'pending' | 'approved' | 'rejected' | 'implemented';
    confidence_score: number | null;
    priority: number | null;
    created_at: string;
    expires_at: string | null;
  };
}

const SuggestionReviewCard = ({ suggestion }: SuggestionReviewCardProps) => {
  const [showReasoningInput, setShowReasoningInput] = useState(false);
  const [adminReasoning, setAdminReasoning] = useState('');
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reasoning }: { status: 'approved' | 'rejected', reasoning?: string }) =>
      updateSuggestionStatus(suggestion.id, status, reasoning),
    onSuccess: (_, variables) => {
      toast({ 
        title: `Suggestion ${variables.status}`, 
        description: `The AI suggestion has been ${variables.status}.` 
      });
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      setShowReasoningInput(false);
      setAdminReasoning('');
    },
    onError: (error) => {
      toast({ 
        title: "Action failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return 'secondary';
    if (priority <= 2) return 'destructive';
    if (priority <= 3) return 'default';
    return 'secondary';
  };

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return 'Normal';
    if (priority === 1) return 'Critical';
    if (priority === 2) return 'High';
    if (priority === 3) return 'Medium';
    return 'Low';
  };

  const handleAction = (status: 'approved' | 'rejected') => {
    if (showReasoningInput) {
      updateStatusMutation.mutate({ status, reasoning: adminReasoning });
    } else {
      setShowReasoningInput(true);
    }
  };

  const renderSuggestionPreview = () => {
    const { suggestion_data } = suggestion;
    
    switch (suggestion.target_type) {
      case 'hero_section':
        return (
          <div className="bg-muted p-3 rounded">
            <h4 className="font-medium">Featured Article Suggestion</h4>
            <p className="text-sm">{suggestion_data.article_title}</p>
            <p className="text-xs text-muted-foreground">
              {suggestion_data.views} views • Position: {suggestion_data.suggested_position}
            </p>
          </div>
        );
      
      case 'article':
        return (
          <div className="bg-muted p-3 rounded">
            <h4 className="font-medium">Article Improvement</h4>
            <p className="text-sm">{suggestion_data.article_title}</p>
            {suggestion_data.excerpt && (
              <div className="mt-2">
                <p className="text-xs font-medium">Suggested Excerpt:</p>
                <p className="text-xs text-muted-foreground">{suggestion_data.excerpt.substring(0, 100)}...</p>
              </div>
            )}
            {suggestion_data.suggested_tags && (
              <div className="mt-2">
                <p className="text-xs font-medium">Suggested Tags:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestion_data.suggested_tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="bg-muted p-3 rounded">
            <p className="text-sm">Target: {suggestion.target_type}</p>
            <pre className="text-xs mt-2 overflow-hidden">
              {JSON.stringify(suggestion_data, null, 2).substring(0, 200)}...
            </pre>
          </div>
        );
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <CardTitle className="text-lg">AI Suggestion</CardTitle>
            <Badge variant={getPriorityColor(suggestion.priority)}>
              {getPriorityLabel(suggestion.priority)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {suggestion.confidence_score && (
              <Badge variant="outline">
                {Math.round(suggestion.confidence_score * 100)}% confidence
              </Badge>
            )}
            <Clock className="h-3 w-3" />
            {format(new Date(suggestion.created_at), 'MMM d, HH:mm')}
          </div>
        </div>
        <CardDescription>
          Target: {suggestion.target_type}
          {suggestion.expires_at && (
            <span className="ml-2 text-orange-600">
              • Expires {format(new Date(suggestion.expires_at), 'MMM d, HH:mm')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Reasoning */}
        <div>
          <h4 className="text-sm font-medium mb-2">AI Reasoning</h4>
          <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
            {suggestion.reasoning}
          </p>
        </div>

        {/* Suggestion Preview */}
        <div>
          <h4 className="text-sm font-medium mb-2">Suggestion Preview</h4>
          {renderSuggestionPreview()}
        </div>

        {/* Admin Reasoning Input */}
        {showReasoningInput && (
          <div className="space-y-2">
            <Label htmlFor={`reasoning-${suggestion.id}`}>Admin Notes (Optional)</Label>
            <Textarea
              id={`reasoning-${suggestion.id}`}
              value={adminReasoning}
              onChange={(e) => setAdminReasoning(e.target.value)}
              placeholder="Add your reasoning for this decision..."
              className="min-h-[80px]"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => handleAction('approved')}
            disabled={updateStatusMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {showReasoningInput ? 'Confirm Approve' : 'Approve'}
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction('rejected')}
            disabled={updateStatusMutation.isPending}
          >
            <XCircle className="h-4 w-4 mr-1" />
            {showReasoningInput ? 'Confirm Reject' : 'Reject'}
          </Button>

          {showReasoningInput && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowReasoningInput(false);
                setAdminReasoning('');
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestionReviewCard;
