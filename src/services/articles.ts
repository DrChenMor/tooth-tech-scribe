
import { supabase } from "@/integrations/supabase/client";
import { Article, ArticleStatus } from "@/types";
import { ArticleFormValues } from "@/lib/schemas";

export const fetchArticleById = async (id: number): Promise<Article | null> => {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
};

export const updateArticleStatus = async ({ id, status }: { id: number; status: ArticleStatus }): Promise<void> => {
  // We mirror the logic in upsertArticle for consistency:
  // 'published' gets the current timestamp, other statuses get epoch time
  // which helps with sorting.
  const published_date = (status === "published" ? new Date().toISOString() : new Date(0).toISOString());

  const { error } = await supabase
    .from("articles")
    .update({ status: status, published_date: published_date })
    .eq("id", id);
    
  if (error) throw new Error(error.message);
};

export const upsertArticle = async ({ id, values, author }: { id?: number; values: ArticleFormValues; author: { name: string | null; avatar_url: string | null } }) => {
  const published_date = (values.status === "published" ? new Date().toISOString() : new Date(0).toISOString());

  // Data common to both create and update
  const data = {
    title: values.title ?? "",
    slug: values.slug ?? "",
    status: values.status,
    published_date,
    image_url: values.image_url === "" ? null : values.image_url ?? null,
    excerpt: values.excerpt ?? null,
    content: values.content ?? null,
    category: values.category ?? null,
    reporter_id: values.reporter_id && values.reporter_id !== "none" ? values.reporter_id : null,
    author_name: values.author_name_override || author.name,
    author_avatar_url: author.avatar_url,
  };
  
  console.log('[upsertArticle] Payload for database:', { id, ...data });

  if (id) {
    // For update, we don't touch 'views' so it's not reset
    const { error } = await supabase.from("articles").update(data).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    // For insert, we rely on the DB default for 'views' (which is 0)
    const { error } = await supabase.from("articles").insert(data);
    if (error) throw new Error(error.message);
  }
};

export const deleteArticle = async (id: number): Promise<void> => {
  // 1. Fetch the article to get its image_url
  const { data: article, error: fetchError } = await supabase
    .from("articles")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch article for deletion: ${fetchError.message}`);
  }

  // 2. If an image URL exists, delete the image from storage
  if (article && article.image_url) {
    try {
      const url = new URL(article.image_url);
      const pathSegments = url.pathname.split('/');
      // Path format: /storage/v1/object/public/article-images/image-name.jpg
      const filePath = pathSegments.slice(pathSegments.indexOf('article-images') + 1).join('/');

      if (filePath) {
        console.log(`[deleteArticle] Attempting to delete image from storage: ${filePath}`);
        const { error: storageError } = await supabase.storage
          .from('article-images')
          .remove([filePath]);

        if (storageError) {
          // Log the error but don't block the article deletion itself
          console.error(`[deleteArticle] Could not delete image from storage: ${storageError.message}`);
        } else {
          console.log(`[deleteArticle] Successfully deleted image from storage.`);
        }
      }
    } catch (e) {
      console.error("[deleteArticle] Error processing image URL for deletion, skipping storage delete.", e);
    }
  }

  // 3. Delete the article record from the database
  const { error: deleteError } = await supabase.from("articles").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);
};
