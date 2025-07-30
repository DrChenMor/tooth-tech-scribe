-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to articles table (768 dimensions for new Gemini model)
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add index for fast vector similarity search
CREATE INDEX IF NOT EXISTS articles_embedding_idx 
ON public.articles 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Function to search articles by similarity
CREATE OR REPLACE FUNCTION search_articles_by_similarity(
    query_embedding vector(768),
    similarity_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id bigint,
    title text,
    slug text,
    excerpt text,
    content text,
    category text,
    published_date timestamptz,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id, a.title, a.slug, a.excerpt, a.content, a.category, a.published_date,
        1 - (a.embedding <=> query_embedding) as similarity
    FROM public.articles a
    WHERE 
        a.status = 'published' 
        AND a.embedding IS NOT NULL
        AND 1 - (a.embedding <=> query_embedding) > similarity_threshold
    ORDER BY a.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to update article embedding
CREATE OR REPLACE FUNCTION update_article_embedding(
    article_id bigint,
    new_embedding vector(768)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.articles 
    SET embedding = new_embedding 
    WHERE id = article_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_articles_by_similarity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_article_embedding TO service_role;

-- Add helpful comments
COMMENT ON COLUMN public.articles.embedding IS 'Vector embedding using Google Gemini (world #1 model)';
COMMENT ON FUNCTION search_articles_by_similarity IS 'Search articles using vector similarity with Google Gemini embeddings'; 