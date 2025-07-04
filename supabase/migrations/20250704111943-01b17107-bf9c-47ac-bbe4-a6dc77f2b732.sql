-- Phase 1: Content Queue and Sources Setup

-- Create enum for content queue status
CREATE TYPE content_queue_status AS ENUM ('pending', 'approved', 'rejected', 'processed');

-- Create content_sources table for managing news/content APIs
CREATE TABLE public.content_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  api_endpoint TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_queue table for storing discovered articles
CREATE TABLE public.content_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source_type VARCHAR NOT NULL,
  source_id UUID REFERENCES public.content_sources(id),
  keywords_used JSONB DEFAULT '[]',
  status content_queue_status NOT NULL DEFAULT 'pending',
  priority_score NUMERIC DEFAULT 0,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_sources
CREATE POLICY "Admins can manage content sources" 
ON public.content_sources 
FOR ALL 
USING (is_admin());

-- RLS policies for content_queue
CREATE POLICY "Admins can manage content queue" 
ON public.content_queue 
FOR ALL 
USING (is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_content_sources_updated_at
BEFORE UPDATE ON public.content_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_queue_updated_at
BEFORE UPDATE ON public.content_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content sources
INSERT INTO public.content_sources (name, api_endpoint, config) VALUES
('PubMed', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/', '{"api_key_required": false, "rate_limit": "3_per_second"}'),
('Europe PMC', 'https://www.ebi.ac.uk/europepmc/webservices/rest/', '{"api_key_required": false, "rate_limit": "unlimited"}'),
('RSS Feeds', 'internal', '{"type": "rss_aggregator"}'),
('Web Scraper', 'internal', '{"type": "web_scraper"}');

-- Add indexes for performance
CREATE INDEX idx_content_queue_status ON public.content_queue(status);
CREATE INDEX idx_content_queue_discovered_at ON public.content_queue(discovered_at DESC);
CREATE INDEX idx_content_queue_priority ON public.content_queue(priority_score DESC);
CREATE INDEX idx_content_sources_active ON public.content_sources(is_active) WHERE is_active = true;