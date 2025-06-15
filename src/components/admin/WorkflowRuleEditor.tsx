
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AutomatedWorkflowService, WorkflowRule, WorkflowCondition, WorkflowAction } from '@/services/automatedWorkflows';
import { Plus, X, Save } from 'lucide-react';

interface WorkflowRuleEditorProps {
  rule?: WorkflowRule | null;
  onClose: () => void;
  onSave: () => void;
}

const WorkflowRuleEditor = ({ rule, onClose, onSave }: WorkflowRuleEditorProps) => {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [priority, setPriority] = useState(rule?.priority || 1);
  const [conditions, setConditions] = useState<WorkflowCondition[]>(rule?.conditions || []);
  const [actions, setActions] = useState<WorkflowAction[]>(rule?.actions || []);
  const [saving, setSaving] = useState(false);

  const addCondition = () => {
    setConditions([...conditions, {
      type: 'confidence_threshold',
      operator: '>' as any,
      value: 0.8
    }]);
  };

  const updateCondition = (index: number, updates: Partial<WorkflowCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions([...actions, {
      type: 'notify_admin',
      parameters: {}
    }]);
  };

  const updateAction = (index: number, updates: Partial<WorkflowAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a rule name');
      return;
    }

    if (conditions.length === 0) {
      alert('Please add at least one condition');
      return;
    }

    if (actions.length === 0) {
      alert('Please add at least one action');
      return;
    }

    setSaving(true);
    try {
      const ruleData = {
        name: name.trim(),
        description: description.trim(),
        priority,
        conditions,
        actions,
        enabled: true
      };

      if (rule) {
        // Update existing rule - would need an update method
        console.log('Update rule:', ruleData);
      } else {
        await AutomatedWorkflowService.createWorkflowRule(ruleData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving workflow rule:', error);
      alert('Failed to save workflow rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Auto-approve high confidence SEO suggestions"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this rule does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority (1-10)</Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  min={1}
                  max={10}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conditions</CardTitle>
                  <CardDescription>
                    Define when this workflow should trigger
                  </CardDescription>
                </div>
                <Button onClick={addCondition} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {conditions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No conditions added. Click "Add Condition" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Select
                          value={condition.type}
                          onValueChange={(value: any) => updateCondition(index, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confidence_threshold">Confidence Threshold</SelectItem>
                            <SelectItem value="agent_type">Agent Type</SelectItem>
                            <SelectItem value="suggestion_type">Suggestion Type</SelectItem>
                            <SelectItem value="time_based">Time Based</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(value: any) => updateCondition(index, { operator: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { 
                            value: condition.type === 'confidence_threshold' || condition.type === 'time_based'
                              ? parseFloat(e.target.value) || 0
                              : e.target.value
                          })}
                          placeholder="Value"
                          type={condition.type === 'confidence_threshold' || condition.type === 'time_based' ? 'number' : 'text'}
                          step={condition.type === 'confidence_threshold' ? '0.1' : '1'}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCondition(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>
                    Define what should happen when conditions are met
                  </CardDescription>
                </div>
                <Button onClick={addAction} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No actions added. Click "Add Action" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {actions.map((action, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <Select
                          value={action.type}
                          onValueChange={(value: any) => updateAction(index, { type: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto_approve">Auto Approve</SelectItem>
                            <SelectItem value="auto_implement">Auto Implement</SelectItem>
                            <SelectItem value="notify_admin">Notify Admin</SelectItem>
                            <SelectItem value="schedule_review">Schedule Review</SelectItem>
                            <SelectItem value="create_task">Create Task</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAction(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Action-specific parameters */}
                      {action.type === 'schedule_review' && (
                        <div className="space-y-2">
                          <Label>Delay (minutes)</Label>
                          <Input
                            type="number"
                            value={action.delay_minutes || 60}
                            onChange={(e) => updateAction(index, { delay_minutes: parseInt(e.target.value) })}
                          />
                        </div>
                      )}

                      {action.type === 'create_task' && (
                        <div className="space-y-2">
                          <Label>Task Title</Label>
                          <Input
                            value={action.parameters?.title || ''}
                            onChange={(e) => updateAction(index, { 
                              parameters: { ...action.parameters, title: e.target.value }
                            })}
                            placeholder="Task title"
                          />
                        </div>
                      )}

                      {action.type === 'notify_admin' && (
                        <div className="space-y-2">
                          <Label>Notification Message</Label>
                          <Textarea
                            value={action.parameters?.message || ''}
                            onChange={(e) => updateAction(index, { 
                              parameters: { ...action.parameters, message: e.target.value }
                            })}
                            placeholder="Custom notification message"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Rule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowRuleEditor;
