
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types";
import { ArticleFormValues } from "@/lib/schemas";

export const fetchArticleById = async (id: number): Promise<Article | null> => {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
};

export const upsertArticle = async ({ id, values }: { id?: number; values: ArticleFormValues }) => {
  const published_date = (values.status === "published" ? new Date().toISOString() : new Date(0).toISOString());

  // Ensure all required fields are always present (even if blank)
  const dataToUpsert = {
    title: values.title ?? "",
    slug: values.slug ?? "",
    status: values.status,
    published_date,
    image_url: values.image_url === "" ? null : values.image_url ?? null,
    excerpt: values.excerpt ?? null,
    content: values.content ?? null,
    category: values.category ?? null,
    // Explicitly set missing optional columns to null for consistency
    author_name: null,
    author_avatar_url: null,
    views: 0,
    // Do not send id if creating a new record
    ...(id ? { id } : {})
  };

  if (id) {
    const { error } = await supabase.from("articles").update(dataToUpsert).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("articles").insert(dataToUpsert);
    if (error) throw new Error(error.message);
  }
};

