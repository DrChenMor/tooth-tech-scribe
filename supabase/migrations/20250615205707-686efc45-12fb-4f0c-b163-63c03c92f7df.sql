
-- Create workflow_rules table
CREATE TABLE public.workflow_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  execution_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0
);

-- Create workflow_executions table
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_rule_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'executing', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT
);

-- Create additional tables for workflow features
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  suggestion_id UUID REFERENCES public.ai_suggestions(id),
  execution_id UUID REFERENCES public.workflow_executions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.scheduled_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  review_type VARCHAR DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.admin_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  related_suggestion_id UUID REFERENCES public.ai_suggestions(id),
  assigned_to UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns to ai_suggestions table
ALTER TABLE public.ai_suggestions 
ADD COLUMN IF NOT EXISTS type VARCHAR,
ADD COLUMN IF NOT EXISTS title VARCHAR,
ADD COLUMN IF NOT EXISTS implemented_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS implementation_notes TEXT,
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Enable RLS on new tables
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin only access for workflow management)
CREATE POLICY "Admin can manage workflow rules" ON public.workflow_rules FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can view workflow executions" ON public.workflow_executions FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage notifications" ON public.admin_notifications FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage scheduled reviews" ON public.scheduled_reviews FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage admin tasks" ON public.admin_tasks FOR ALL USING (public.is_admin());
