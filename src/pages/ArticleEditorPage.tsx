import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Article, ArticleStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const articleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug must be at least 3 characters long."),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  image_url: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  status: z.enum(["draft", "published", "archived"]),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

const fetchArticleById = async (id: number): Promise<Article | null> => {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
};

const upsertArticle = async ({ id, values }: { id?: number, values: ArticleFormValues }) => {
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


const ArticleEditorPage = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(articleId);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article-editor', articleId],
    queryFn: () => fetchArticleById(Number(articleId)),
    enabled: isEditMode,
  });

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "",
      image_url: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (isEditMode && article) {
      form.reset({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || "",
        content: article.content || "",
        category: article.category || "",
        image_url: article.image_url || "",
        status: article.status,
      });
    }
  }, [article, form, isEditMode]);

  const mutation = useMutation({
    mutationFn: upsertArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article-editor', articleId] });
      toast({ title: `Article ${isEditMode ? 'updated' : 'created'} successfully!` });
      navigate("/admin");
    },
    onError: (error) => {
      toast({ title: "An error occurred", description: error.message, variant: "destructive" });
    }
  });

  const onSubmit = (values: ArticleFormValues) => {
    mutation.mutate({ id: articleId ? Number(articleId) : undefined, values });
  };
  
  if (isLoading && isEditMode) {
    return (
       <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-1/2" />
            </div>
        </main>
        <Footer />
       </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Article' : 'Create New Article'}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Your article title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="your-article-slug" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Technology" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short summary of the article..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write your article content here..." className="min-h-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(["draft", "published", "archived"] as ArticleStatus[]).map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (isEditMode ? 'Update Article' : 'Create Article')}
            </Button>
          </form>
        </Form>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleEditorPage;
