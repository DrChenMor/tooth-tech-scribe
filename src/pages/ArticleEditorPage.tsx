import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import ArticleForm from "@/components/admin/ArticleForm";
import ArticleEditorSkeleton from "@/components/admin/ArticleEditorSkeleton";
import { articleSchema, ArticleFormValues } from "@/lib/schemas";
import { fetchArticleById, upsertArticle } from "@/services/articles";
import { uploadArticleImage } from "@/services/storage";
import { useAuth } from "@/contexts/AuthContext";
import { slugify } from "@/lib/slugify";

const ArticleEditorPage = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(articleId);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
      reporter_id: "none",
      author_name_override: "",
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
        reporter_id: article.reporter_id || "none",
        author_name_override: "",
      });
    }
  }, [article, form, isEditMode]);

  const mutation = useMutation({
    mutationFn: upsertArticle,
    onSuccess: () => {
      // 🔥 UPDATED: Invalidate specific query keys
      queryClient.invalidateQueries({ queryKey: ['published-articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] }); // Legacy
      queryClient.invalidateQueries({ queryKey: ['article-editor', articleId] });
      toast({ title: `Article ${isEditMode ? 'updated' : 'created'} successfully!` });
      navigate("/admin");
    },
    onError: (error) => {
      toast({ title: "An error occurred", description: error.message, variant: "destructive" });
    }
  });

  const onSubmit = async (values: ArticleFormValues) => {
    console.log('[ArticleEditorPage] Submitting form with values:', values);

    let finalValues = { ...values };

    if (finalValues.image_url instanceof File) {
      setIsUploadingImage(true);
      try {
        const publicUrl = await uploadArticleImage(finalValues.image_url);
        finalValues.image_url = publicUrl;
      } catch (error) {
        toast({ title: "Image upload failed", description: (error as Error).message, variant: "destructive" });
        setIsUploadingImage(false);
        return; // Stop submission on upload failure
      } finally {
        setIsUploadingImage(false);
      }
    }

    const authorProfile = profile || {
      full_name: "Demo Admin",
      avatar_url: null,
    };

    mutation.mutate({
      id: articleId ? Number(articleId) : undefined,
      values: {
        ...finalValues,
        image_url: typeof finalValues.image_url === 'string' ? finalValues.image_url : '',
      },
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
        isPending={mutation.isPending || isUploadingImage}
        isEditMode={isEditMode}
      />
    </>
  );
};

export default ArticleEditorPage;
