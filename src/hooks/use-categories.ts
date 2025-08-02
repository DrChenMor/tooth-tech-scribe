
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchCategories = async () => {
  // First try to get categories from the new categories table
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('name, icon')
    .order('name');

  if (!categoriesError && categoriesData && categoriesData.length > 0) {
    return categoriesData.map(cat => ({
      name: cat.name,
      icon: cat.icon || 'tag'
    }));
  }

  // Fallback to articles table if categories table is empty or has error
  console.log('Falling back to articles table for categories');
  const { data: articlesData, error: articlesError } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null);

  if (articlesError) {
    console.error('Error fetching categories from articles:', articlesError);
    throw new Error(articlesError.message);
  }

  if (!articlesData) return [];

  // Get unique categories and assign default icons
  const uniqueCategories = [...new Set(articlesData.map(item => item.category).filter(Boolean))];
  
  return uniqueCategories.map(categoryName => ({
    name: categoryName,
    icon: getDefaultIcon(categoryName)
  }));
};

const getDefaultIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('ai') || name.includes('technology')) return 'brain';
  if (name.includes('research')) return 'microscope';
  if (name.includes('industry') || name.includes('news')) return 'newspaper';
  if (name.includes('tool') || name.includes('software')) return 'wrench';
  if (name.includes('general')) return 'stethoscope';
  return 'tag';
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};
