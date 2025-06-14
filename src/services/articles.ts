
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types";
import { ArticleFormValues } from "@/lib/schemas";

export const fetchArticleById = async (id: number): Promise<Article | null> => {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
};

export const upsertArticle = async ({ id, values }: { id?: number; values: ArticleFormValues }) => {
  const published_date = (values.status === 'published' ? new Date().toISOString() : new Date(0).toISOString());

  const dataToUpsert = {
    ...values,
    published_date,
    image_url: values.image_url || null,
    excerpt: values.excerpt ?? null,
    content: values.content ?? null,
    category: values.category ?? null,
  };

  if (id) {
    // Update
    const { error } = await supabase.from("articles").update(dataToUpsert).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    // Create
    const { error } = await supabase.from("articles").insert(dataToUpsert);
    if (error) throw new Error(error.message);
  }
};
