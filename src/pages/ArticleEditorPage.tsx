import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import ArticleForm from "@/components/admin/ArticleForm";
import ArticleEditorSkeleton from "@/components/admin/ArticleEditorSkeleton";
import { articleSchema, ArticleFormValues } from "@/lib/schemas";
import { fetchArticleById, upsertArticle } from "@/services/articles";
import { useAuth } from "@/contexts/AuthContext";
import { slugify } from "@/lib/slugify";

const ArticleEditorPage = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(articleId);
  const { profile } = useAuth();

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

  const { watch, setValue } = form;
  const title = watch("title");

  useEffect(() => {
    if (!isEditMode) {
      const slug = slugify(title);
      setValue("slug", slug, { shouldValidate: true, shouldDirty: !!slug });
    }
  }, [title, isEditMode, setValue]);

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
    const authorProfile = profile || {
      full_name: "Demo Admin",
      avatar_url: null,
    };

    mutation.mutate({
      id: articleId ? Number(articleId) : undefined,
      values,
      author: {
        name: authorProfile.full_name,
        avatar_url: authorProfile.avatar_url,
      },
    });
  };
  
  if (isLoading && isEditMode) {
    return <ArticleEditorSkeleton />;
  }

  return (
    <>
      <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Admin
      </Button>
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Article' : 'Create New Article'}</h1>
      <ArticleForm 
        form={form}
        onSubmit={onSubmit}
        isPending={mutation.isPending}
        isEditMode={isEditMode}
      />
    </>
  );
};

export default ArticleEditorPage;
