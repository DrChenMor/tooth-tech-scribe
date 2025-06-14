
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
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}
