
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AutomatedWorkflowService, 
  WorkflowRule, 
  WorkflowExecution 
} from '@/services/automatedWorkflows';
import WorkflowRuleEditor from './WorkflowRuleEditor';
import WorkflowExecutionList from './WorkflowExecutionList';
import { 
  Zap, 
  Plus, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const AutomatedWorkflowsDashboard = () => {
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['workflow-rules'],
    queryFn: AutomatedWorkflowService.getWorkflowRules,
  });

  const { data: executions = [], isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: () => AutomatedWorkflowService.getWorkflowExecutions(20),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      AutomatedWorkflowService.toggleWorkflowRule(ruleId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: AutomatedWorkflowService.deleteWorkflowRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    toggleRuleMutation.mutate({ ruleId, enabled });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this workflow rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const handleEditRule = (rule: WorkflowRule) => {
    setEditingRule(rule);
    setShowRuleEditor(true);
  };

  const handleCloseEditor = () => {
    setShowRuleEditor(false);
    setEditingRule(null);
  };

  const activeRules = rules.filter(rule => rule.enabled);
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.status === 'completed').length;
  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

  if (rulesLoading || executionsLoading) {
    return <div>Loading automated workflows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Automated Workflows
          </h2>
          <p className="text-muted-foreground">
            Automate suggestion processing and implementation
          </p>
        </div>
        <Button onClick={() => setShowRuleEditor(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Workflow Rule
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <div className="text-2xl font-bold">{activeRules.length}</div>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                <div className="text-2xl font-bold">{totalExecutions}</div>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auto-Implemented</p>
                <div className="text-2xl font-bold">
                  {executions.filter(e => e.result?.actions_executed > 0).length}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Workflow Rules</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Workflow Rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first workflow rule to automate suggestion processing
                  </p>
                  <Button onClick={() => setShowRuleEditor(true)}>
                    Create Workflow Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {rule.name}
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Active" : "Inactive"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(enabled) => handleToggleRule(rule.id, enabled)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Conditions</p>
                        <p className="text-muted-foreground">{rule.conditions.length} conditions</p>
                      </div>
                      <div>
                        <p className="font-medium">Actions</p>
                        <p className="text-muted-foreground">{rule.actions.length} actions</p>
                      </div>
                      <div>
                        <p className="font-medium">Performance</p>
                        <p className="text-muted-foreground">
                          {rule.execution_count} executions, {rule.success_rate.toFixed(1)}% success
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <WorkflowExecutionList executions={executions} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['completed', 'failed', 'executing', 'pending'].map(status => {
                    const count = executions.filter(e => e.status === status).length;
                    const percentage = totalExecutions > 0 ? (count / totalExecutions) * 100 : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count}</span>
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rules
                    .sort((a, b) => b.success_rate - a.success_rate)
                    .slice(0, 5)
                    .map(rule => (
                      <div key={rule.id} className="flex items-center justify-between">
                        <span className="text-sm">{rule.name}</span>
                        <Badge variant="outline">
                          {rule.success_rate.toFixed(1)}% success
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showRuleEditor && (
        <WorkflowRuleEditor
          rule={editingRule}
          onClose={handleCloseEditor}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
            handleCloseEditor();
          }}
        />
      )}
    </div>
  );
};

export default AutomatedWorkflowsDashboard;
