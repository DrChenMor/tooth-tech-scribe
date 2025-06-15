
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowExecution } from '@/services/automatedWorkflows';
import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

interface WorkflowExecutionListProps {
  executions: WorkflowExecution[];
}

const WorkflowExecutionList = ({ executions }: WorkflowExecutionListProps) => {
  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'executing':
        return <Loader className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'executing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Executions Yet</h3>
            <p className="text-muted-foreground">
              Workflow executions will appear here once your rules start running
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {executions.map((execution: any) => (
        <Card key={execution.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {execution.workflow_rules?.name || 'Unknown Rule'}
              </CardTitle>
              <Badge variant="outline" className={getStatusColor(execution.status)}>
                {getStatusIcon(execution.status)}
                <span className="ml-1 capitalize">{execution.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Suggestion</p>
                <p className="text-muted-foreground">
                  {execution.ai_suggestions?.title || 'N/A'}
                </p>
              </div>
              <div>
                <p className="font-medium">Started At</p>
                <p className="text-muted-foreground">
                  {new Date(execution.started_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-muted-foreground">
                  {execution.completed_at
                    ? `${Math.round(
                        (new Date(execution.completed_at).getTime() - 
                         new Date(execution.started_at).getTime()) / 1000
                      )}s`
                    : 'In progress'
                  }
                </p>
              </div>
            </div>

            {execution.error_message && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">Error:</p>
                <p className="text-sm text-red-700">{execution.error_message}</p>
              </div>
            )}

            {execution.result && Object.keys(execution.result).length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 font-medium">Result:</p>
                <div className="text-sm text-green-700">
                  {execution.result.actions_executed && (
                    <p>Actions executed: {execution.result.actions_executed}</p>
                  )}
                  {Object.entries(execution.result).map(([key, value]) => 
                    key !== 'actions_executed' && (
                      <p key={key}>{key}: {String(value)}</p>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WorkflowExecutionList;
