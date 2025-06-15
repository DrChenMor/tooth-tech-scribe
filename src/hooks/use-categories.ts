
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchCategories = async () => {
  const { data, error } = await supabase.from('articles').select('category');

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error(error.message);
  }

  if (!data) return [];

  const categories = data.map(item => item.category).filter(Boolean);
  return [...new Set(categories)] as string[];
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};
