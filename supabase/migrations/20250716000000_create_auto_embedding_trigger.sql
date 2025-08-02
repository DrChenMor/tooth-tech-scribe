-- Create auto-embedding trigger for published articles

-- Create a simple queue table for embedding requests
CREATE TABLE IF NOT EXISTS public.embedding_queue (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGINT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  force_update BOOLEAN DEFAULT false
);

-- Create unique index to prevent duplicate pending requests for the same article
CREATE UNIQUE INDEX IF NOT EXISTS embedding_queue_article_pending_idx 
ON public.embedding_queue (article_id) 
WHERE status = 'pending';

-- Enable RLS for the embedding queue
ALTER TABLE public.embedding_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for embedding queue
CREATE POLICY "Allow authenticated users to read embedding queue"
  ON public.embedding_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert embedding queue"
  ON public.embedding_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update embedding queue"
  ON public.embedding_queue FOR UPDATE
  TO authenticated
  USING (true);

-- Create a function that adds articles to the embedding queue
CREATE OR REPLACE FUNCTION trigger_auto_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for published articles that don't already have an embedding or when forcing update
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Log the trigger activation
    RAISE LOG 'Auto-embedding triggered for article %: %', NEW.id, NEW.title;
    
    -- Add to embedding queue (avoid duplicates)
    INSERT INTO public.embedding_queue (article_id, force_update)
    VALUES (NEW.id, false)
    ON CONFLICT DO NOTHING;
    
    RAISE LOG 'Article % added to embedding queue', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_embedding_trigger ON public.articles;

CREATE TRIGGER auto_embedding_trigger
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_embedding();

-- Set up configuration settings for the Edge Function URL
-- These will be set via environment variables or Supabase dashboard
COMMENT ON FUNCTION trigger_auto_embedding() IS 'Automatically triggers embedding generation when articles are published';

-- Add some helpful logging
CREATE OR REPLACE FUNCTION log_embedding_trigger_status()
RETURNS TABLE(
  trigger_name text,
  event_manipulation text,
  event_object_table text,
  action_statement text,
  action_timing text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.trigger_name::text,
    t.event_manipulation::text,
    t.event_object_table::text,
    t.action_statement::text,
    t.action_timing::text
  FROM information_schema.triggers t
  WHERE t.trigger_name = 'auto_embedding_trigger';
END;
$$ LANGUAGE plpgsql;

-- Create a manual function to trigger embedding for existing articles
CREATE OR REPLACE FUNCTION manual_trigger_embedding(article_id_param bigint)
RETURNS jsonb AS $$
DECLARE
  article_record record;
  queue_id bigint;
BEGIN
  -- Get the article
  SELECT * INTO article_record 
  FROM public.articles 
  WHERE id = article_id_param AND status = 'published';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Article not found or not published',
      'articleId', article_id_param
    );
  END IF;
  
  -- Add to embedding queue with force update
  INSERT INTO public.embedding_queue (article_id, force_update)
  VALUES (article_id_param, true)
  RETURNING id INTO queue_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Embedding queued manually',
    'articleId', article_id_param,
    'articleTitle', article_record.title,
    'queueId', queue_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to process the embedding queue
CREATE OR REPLACE FUNCTION process_embedding_queue()
RETURNS jsonb AS $$
DECLARE
  queue_item record;
  processed_count integer := 0;
  failed_count integer := 0;
  result jsonb;
BEGIN
  -- Process pending items in the queue
  FOR queue_item IN 
    SELECT eq.*, a.title as article_title
    FROM public.embedding_queue eq
    JOIN public.articles a ON eq.article_id = a.id
    WHERE eq.status = 'pending' 
    AND eq.retry_count < 3
    ORDER BY eq.created_at ASC
    LIMIT 10  -- Process in small batches
  LOOP
    BEGIN
      -- Mark as processing
      UPDATE public.embedding_queue 
      SET status = 'processing', processed_at = NOW()
      WHERE id = queue_item.id;
      
      -- Here we would normally call the Edge Function
      -- For now, we'll just mark it as completed
      -- In production, this would be called by a cron job or webhook
      
      RAISE LOG 'Processing embedding for article % (queue item %)', queue_item.article_id, queue_item.id;
      
      -- Mark as completed (this will be updated when we integrate with the Edge Function)
      UPDATE public.embedding_queue 
      SET status = 'completed', processed_at = NOW()
      WHERE id = queue_item.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed and increment retry count
      UPDATE public.embedding_queue 
      SET 
        status = 'failed', 
        error_message = SQLERRM,
        retry_count = retry_count + 1,
        processed_at = NOW()
      WHERE id = queue_item.id;
      
      failed_count := failed_count + 1;
      
      RAISE LOG 'Failed to process embedding for article % (queue item %): %', 
        queue_item.article_id, queue_item.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed', processed_count,
    'failed', failed_count,
    'message', FORMAT('Processed %s items, %s failed', processed_count, failed_count)
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_auto_embedding() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_embedding_trigger_status() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION manual_trigger_embedding(bigint) TO authenticated, anon;