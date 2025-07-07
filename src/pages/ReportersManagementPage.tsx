import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit3, Trash2, User, Mail, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// 🔧 TEMPORARY TYPE FIX - Remove this when Supabase types are regenerated
type ReporterRow = {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  specialties: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

interface Reporter {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar_url: string;
  specialties: string[];
  is_active: boolean;
  created_at: string;
}

const ReportersManagementPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReporter, setEditingReporter] = useState<Reporter | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar_url: '',
    specialties: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  // Fetch reporters
  const { data: reporters, isLoading } = useQuery({
    queryKey: ['reporters'],
    queryFn: async () => {
      // 🔧 Type assertion to bypass TypeScript error
      const { data, error } = await (supabase as any)
        .from('reporters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Reporter[];
    },
  });

  // Create/Update reporter mutation
  const saveReporterMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const specialtiesArray = data.specialties.split(',').map(s => s.trim()).filter(s => s);
      
      const reporterData = {
        name: data.name,
        email: data.email,
        bio: data.bio,
        avatar_url: data.avatar_url,
        specialties: specialtiesArray,
        is_active: data.is_active
      };

      if (editingReporter) {
        const { error } = await (supabase as any)
          .from('reporters')
          .update(reporterData)
          .eq('id', editingReporter.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('reporters')
          .insert([reporterData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporters'] });
      setIsCreateDialogOpen(false);
      setEditingReporter(null);
      resetForm();
      toast({ title: `Reporter ${editingReporter ? 'updated' : 'created'} successfully!` });
    },
    onError: (error) => {
      toast({ title: 'Error saving reporter', description: error.message, variant: 'destructive' });
    },
  });

  // Delete reporter mutation
  const deleteReporterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('reporters')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporters'] });
      toast({ title: 'Reporter deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting reporter', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      bio: '',
      avatar_url: '',
      specialties: '',
      is_active: true
    });
  };

  const handleEdit = (reporter: Reporter) => {
    setEditingReporter(reporter);
    setFormData({
      name: reporter.name,
      email: reporter.email || '',
      bio: reporter.bio || '',
      avatar_url: reporter.avatar_url || '',
      specialties: reporter.specialties?.join(', ') || '',
      is_active: reporter.is_active
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveReporterMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading reporters...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            Reporters Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your team of reporters and writers.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingReporter} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingReporter(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Reporter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingReporter ? 'Edit Reporter' : 'Add New Reporter'}</DialogTitle>
              <DialogDescription>
                {editingReporter ? 'Update reporter information' : 'Create a new reporter profile'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <div>
                <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                <Input
                  id="specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                  placeholder="AI, Dentistry, Research"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saveReporterMutation.isPending}>
                  {saveReporterMutation.isPending ? 'Saving...' : editingReporter ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingReporter(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reporters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reporters?.map((reporter) => (
          <Card key={reporter.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={reporter.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reporter.name)}&size=60`}
                  alt={reporter.name}
                  className="w-15 h-15 rounded-full object-cover"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg">{reporter.name}</CardTitle>
                  {reporter.email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {reporter.email}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {reporter.bio && (
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground line-clamp-2">{reporter.bio}</p>
                </div>
              )}
              
              {reporter.specialties && reporter.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {reporter.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Badge variant={reporter.is_active ? "default" : "secondary"}>
                  {reporter.is_active ? "Active" : "Inactive"}
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(reporter)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => deleteReporterMutation.mutate(reporter.id)}
                    disabled={deleteReporterMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!reporters?.length && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">No Reporters Found</CardTitle>
            <CardDescription className="mb-6">
              Get started by adding your first reporter.
            </CardDescription>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Reporter
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportersManagementPage;