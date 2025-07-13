export type ArticleStatus = "draft" | "published" | "archived";

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  published_date: string;
  category: string | null;
  status: ArticleStatus;
  views: number;
  seo_score?: number;
  seo_details?: any; // SEO analysis details
  source_references?: string[] | any[]; // Adjust type based on your data structure
  reporter_id?: string; // 🔧 NEW
  reporter?: {          // 🔧 NEW
    id: string;
    name: string;
    bio?: string;
    avatar_url?: string;
    specialties?: string[];
  };
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}