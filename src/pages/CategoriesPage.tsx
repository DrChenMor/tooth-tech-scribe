
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';

const fetchCategoriesWithCounts = async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error(error.message);
  }

  if (!data) return [];

  // Count articles per category
  const categoryCount = data.reduce((acc: Record<string, number>, item) => {
    if (item.category) {
      acc[item.category] = (acc[item.category] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(categoryCount).map(([category, count]) => ({
    name: category,
    count,
  }));
};

const CategoriesPage = () => {
  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['categories-with-counts'],
    queryFn: fetchCategoriesWithCounts,
  });

  const categoryColors = [
    'bg-gradient-to-br from-yellow-400 to-orange-400',
    'bg-gradient-to-br from-purple-500 to-pink-500',
    'bg-gradient-to-br from-pink-400 to-red-400',
    'bg-gradient-to-br from-green-500 to-teal-500',
    'bg-gradient-to-br from-blue-500 to-indigo-500',
    'bg-gradient-to-br from-indigo-500 to-purple-500',
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col flex-grow">
        <main className="flex-grow">
          <div className="container mx-auto px-4">
            <div className="pt-12 pb-8 text-center">
              <Skeleton className="h-12 w-64 mx-auto" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col flex-grow">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Failed to load categories</h2>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <main className="flex-grow">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="pt-12 pb-8 text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">All categories</h1>
          </div>

          {/* Categories Grid */}
          {categories && categories.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-12">
              {categories.map((category, index) => (
                <Link
                  key={category.name}
                  to={`/category/${encodeURIComponent(category.name)}`}
                  className="group"
                >
                  <Card className={`${categoryColors[index % categoryColors.length]} p-8 h-64 flex flex-col justify-between text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden`}>
                    {/* Category name badge */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
                      <span className="text-white font-medium text-sm">
                        {category.name}
                      </span>
                    </div>
                    
                    {/* Bottom section with article count */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/80 text-sm mb-1">
                          {category.count} article{category.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      {/* Arrow icon */}
                      <div className="bg-black/20 rounded-full p-2 group-hover:bg-black/30 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold">No categories found</h2>
              <p className="text-muted-foreground">Check back later for new content!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoriesPage;
