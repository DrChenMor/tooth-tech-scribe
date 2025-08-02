
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('name, icon')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error(error.message);
  }

  if (!data) return [];

  return data.map(cat => ({
    name: cat.name,
    icon: cat.icon || 'tag'
  }));
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};
