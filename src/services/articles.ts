
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

  if (id) {
    // Update
    const { error } = await supabase.from("articles").update({ ...values, published_date }).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    // Create
    const { error } = await supabase.from("articles").insert({ ...values, published_date });
    if (error) throw new Error(error.message);
  }
};
