
import * as z from "zod";

export const articleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug must be at least 3 characters long."),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  image_url: z.any().optional(),
  status: z.enum(["draft", "published", "archived"]),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;
