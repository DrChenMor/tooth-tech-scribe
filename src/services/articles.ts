import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types";
import { ArticleFormValues } from "@/lib/schemas";

export const fetchArticleById = async (id: number): Promise<Article | null> => {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
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
    author_name: author.name,
    author_avatar_url: author.avatar_url,
  };

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
