
-- Create enum for suggestion status
CREATE TYPE suggestion_status AS ENUM ('pending', 'approved', 'rejected', 'implemented');

-- Create enum for admin action types
CREATE TYPE admin_action_type AS ENUM ('approve', 'reject', 'edit', 'dismiss');

-- Create enum for admin feedback types
CREATE TYPE admin_feedback_type AS ENUM ('good', 'irrelevant', 'wrong', 'excellent');

-- Create AI agents table to store agent configurations
CREATE TABLE public.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI suggestions table to store all AI-generated suggestions
CREATE TABLE public.ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'article', 'category', 'site_config', etc.
    target_id VARCHAR(100), -- ID of the target entity (could be article ID, etc.)
    suggestion_data JSONB NOT NULL, -- The actual suggestion content
    reasoning TEXT NOT NULL, -- AI's explanation for the suggestion
    status suggestion_status DEFAULT 'pending',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=highest, 5=lowest
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE -- Some suggestions may have expiry
);

-- Create admin actions log for audit trail
CREATE TABLE public.admin_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    suggestion_id UUID REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
    action_type admin_action_type NOT NULL,
    original_data JSONB,
    modified_data JSONB,
    admin_reasoning TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create agent performance metrics table
CREATE TABLE public.agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
    suggestion_id UUID REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
    admin_feedback admin_feedback_type,
    performance_score DECIMAL(3,2) CHECK (performance_score >= 0 AND performance_score <= 1),
    feedback_notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_ai_suggestions_status ON public.ai_suggestions(status);
CREATE INDEX idx_ai_suggestions_agent_id ON public.ai_suggestions(agent_id);
CREATE INDEX idx_ai_suggestions_target ON public.ai_suggestions(target_type, target_id);
CREATE INDEX idx_ai_suggestions_created_at ON public.ai_suggestions(created_at DESC);
CREATE INDEX idx_admin_actions_log_admin_id ON public.admin_actions_log(admin_id);
CREATE INDEX idx_admin_actions_log_timestamp ON public.admin_actions_log(timestamp DESC);

-- Enable RLS on all tables
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access only
CREATE POLICY "Admins can manage AI agents" ON public.ai_agents
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage AI suggestions" ON public.ai_suggestions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view admin actions log" ON public.admin_actions_log
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert admin actions log" ON public.admin_actions_log
  FOR INSERT WITH CHECK (public.is_admin() AND admin_id = auth.uid());

CREATE POLICY "Admins can manage agent performance metrics" ON public.agent_performance_metrics
  FOR ALL USING (public.is_admin());

-- Insert initial AI agents
INSERT INTO public.ai_agents (name, type, description, config) VALUES 
  ('trending-content-agent', 'trending', 'Monitors article engagement and suggests featured content', '{"check_interval": "1h", "min_views_threshold": 100}'),
  ('summarization-agent', 'content', 'Generates summaries and suggests tags for articles', '{"max_summary_length": 200, "auto_tag_confidence": 0.8}'),
  ('content-gap-agent', 'quality', 'Reviews content for gaps, outdated information, and quality issues', '{"quality_threshold": 0.7, "freshness_days": 30}');
