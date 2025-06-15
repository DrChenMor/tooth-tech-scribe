
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, Settings, Plus, Workflow, Clock, Zap, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'schedule' | 'suggestion_approved' | 'low_performance' | 'high_volume';
  conditions: Record<string, any>;
  actions: Array<{
    type: 'create_agent' | 'send_notification' | 'update_config' | 'run_analysis';
    config: Record<string, any>;
  }>;
  enabled: boolean;
  last_run?: string;
  run_count: number;
}

interface Integration {
  id: string;
  name: string;
  type: 'webhook' | 'email' | 'slack' | 'zapier';
  config: Record<string, any>;
  enabled: boolean;
  last_used?: string;
}

const WorkflowAutomationDashboard = () => {
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with real API calls
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      // Mock automation rules
      return [
        {
          id: '1',
          name: 'Auto-Create Performance Agent',
          description: 'Creates a new performance monitoring agent when suggestion volume is high',
          trigger: 'high_volume',
          conditions: { threshold: 100, timeframe: '1h' },
          actions: [
            {
              type: 'create_agent',
              config: { type: 'performance-monitor', priority: 'high' }
            }
          ],
          enabled: true,
          last_run: '2024-01-15T10:30:00Z',
          run_count: 15
        },
        {
          id: '2',
          name: 'Weekly Performance Report',
          description: 'Sends weekly performance summary to administrators',
          trigger: 'schedule',
          conditions: { cron: '0 9 * * 1' },
          actions: [
            {
              type: 'send_notification',
              config: { type: 'email', template: 'weekly-report' }
            }
          ],
          enabled: true,
          last_run: '2024-01-14T09:00:00Z',
          run_count: 8
        },
        {
          id: '3',
          name: 'Low Performance Alert',
          description: 'Alerts when agent approval rate drops below threshold',
          trigger: 'low_performance',
          conditions: { approval_rate: 60, duration: '30m' },
          actions: [
            {
              type: 'send_notification',
              config: { type: 'slack', channel: '#ai-alerts' }
            }
          ],
          enabled: false,
          run_count: 0
        }
      ];
    }
  });

  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      // Mock integrations
      return [
        {
          id: '1',
          name: 'Slack Notifications',
          type: 'slack',
          config: { webhook_url: 'https://hooks.slack.com/...', channel: '#ai-copilot' },
          enabled: true,
          last_used: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Email Alerts',
          type: 'email',
          config: { smtp_server: 'smtp.company.com', recipients: ['admin@company.com'] },
          enabled: true,
          last_used: '2024-01-15T08:15:00Z'
        },
        {
          id: '3',
          name: 'Zapier Automation',
          type: 'zapier',
          config: { webhook_url: '', zap_name: 'AI CoPilot Workflow' },
          enabled: false
        }
      ];
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
      // Mock API call
      console.log(`Toggling rule ${ruleId} to ${enabled}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({ title: 'Success', description: 'Automation rule updated successfully' });
    }
  });

  const runRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      // Mock API call
      console.log(`Running rule ${ruleId}`);
      return { success: true, message: 'Rule executed successfully' };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({ title: 'Success', description: data.message });
    }
  });

  const testIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      // Mock API call
      console.log(`Testing integration ${integrationId}`);
      return { success: true, message: 'Integration test successful' };
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: data.message });
    }
  });

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'high_volume': return <Zap className="h-4 w-4" />;
      default: return <Workflow className="h-4 w-4" />;
    }
  };

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'schedule': return 'bg-blue-100 text-blue-800';
      case 'high_volume': return 'bg-orange-100 text-orange-800';
      case 'low_performance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Workflow Automation
          </h2>
          <p className="text-muted-foreground">
            Automate AI CoPilot operations and integrate with external services
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowRuleDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Rule
          </Button>
          <Button variant="outline" onClick={() => setShowIntegrationDialog(true)} className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Add Integration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Rules</CardTitle>
            <CardDescription>Configure automated workflows and triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rulesLoading ? (
              <div className="text-center py-4">Loading rules...</div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant="outline" className={getTriggerColor(rule.trigger)}>
                        {getTriggerIcon(rule.trigger)}
                        <span className="ml-1 capitalize">{rule.trigger.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Runs: {rule.run_count}</span>
                      {rule.last_run && (
                        <span>Last: {new Date(rule.last_run).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        toggleRuleMutation.mutate({ ruleId: rule.id, enabled: checked })
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runRuleMutation.mutate(rule.id)}
                      disabled={!rule.enabled}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRule(rule);
                        setShowRuleDialog(true);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* External Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>External Integrations</CardTitle>
            <CardDescription>Connect with external services and tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrationsLoading ? (
              <div className="text-center py-4">Loading integrations...</div>
            ) : (
              integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{integration.name}</h4>
                      <Badge variant="outline" className="capitalize">
                        {integration.type}
                      </Badge>
                    </div>
                    {integration.last_used && (
                      <p className="text-xs text-muted-foreground">
                        Last used: {new Date(integration.last_used).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={integration.enabled} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testIntegrationMutation.mutate(integration.id)}
                    >
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedIntegration(integration);
                        setShowIntegrationDialog(true);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{rules.filter(r => r.enabled).length}</div>
            <p className="text-sm text-muted-foreground">Active Rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{rules.reduce((sum, r) => sum + r.run_count, 0)}</div>
            <p className="text-sm text-muted-foreground">Total Executions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{integrations.filter(i => i.enabled).length}</div>
            <p className="text-sm text-muted-foreground">Connected Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">99.2%</div>
            <p className="text-sm text-muted-foreground">Automation Success</p>
          </CardContent>
        </Card>
      </div>

      {/* Rule Creation/Edit Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRule ? 'Edit Rule' : 'Create Automation Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input id="rule-name" placeholder="Enter rule name" />
              </div>
              <div>
                <Label htmlFor="rule-trigger">Trigger Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="suggestion_approved">Suggestion Approved</SelectItem>
                    <SelectItem value="low_performance">Low Performance</SelectItem>
                    <SelectItem value="high_volume">High Volume</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="rule-description">Description</Label>
              <Input id="rule-description" placeholder="Describe what this rule does" />
            </div>
            <Separator />
            <div>
              <Label>Actions</Label>
              <div className="mt-2 space-y-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowRuleDialog(false);
                setSelectedRule(null);
                toast({ title: 'Success', description: 'Rule saved successfully' });
              }}>
                Save Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Dialog */}
      <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedIntegration ? 'Edit Integration' : 'Add Integration'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="integration-name">Integration Name</Label>
              <Input id="integration-name" placeholder="Enter integration name" />
            </div>
            <div>
              <Label htmlFor="integration-type">Integration Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="zapier">Zapier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowIntegrationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowIntegrationDialog(false);
                setSelectedIntegration(null);
                toast({ title: 'Success', description: 'Integration saved successfully' });
              }}>
                Save Integration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowAutomationDashboard;
