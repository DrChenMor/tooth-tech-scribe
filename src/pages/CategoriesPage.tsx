import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';

// 🆕 NEW: Function to try multiple image formats
const getImageWithFallbacks = (categoryName: string, fallbackImage: string): string => {
  const supabaseUrl = 'https://nuhjsrmkkqtecfkjrcox.supabase.co';
  const slug = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // List of formats to try in order of preference
  const formats = ['png', 'jpg', 'jpeg', 'webp'];
  
  // Create a CSS background-image with multiple fallbacks
  const imageUrls = formats.map(format => 
    `url("${supabaseUrl}/storage/v1/object/public/article-images/category-${slug}.${format}")`
  );
  
  // Add the final fallback (Unsplash)
  imageUrls.push(`url("${fallbackImage}")`);
  
  return imageUrls.join(', ');
};

// 🔧 UPDATED: Fallback images if Supabase images don't exist
const getFallbackImage = (index: number): string => {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=250&fit=crop', // General/Medical
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop', // Industry/Business
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop', // Tools/Equipment
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop', // Tech/Digital
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop', // AI/Innovation
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop', // News/Research
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=250&fit=crop', // Default for new categories
  ];
  return fallbackImages[index % fallbackImages.length];
};

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
              {categories.map((category, index) => {
                // 🔧 UPDATED: Smart image selection with multiple format support
                const fallbackImage = getFallbackImage(index);
                
                return (
                  <Link
                    key={category.name}
                    to={`/category/${encodeURIComponent(category.name)}`}
                    className="group"
                  >
                    <Card className="p-0 h-64 border-0 shadow-none transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer relative overflow-hidden">
                      {/* Background image remains */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: getImageWithFallbacks(category.name, fallbackImage) }}
                      />
                      {/* Remove the blur and overlay for flat look */}
                      {/* <div className="absolute inset-0 bg-black/5" /> */}
                      <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                        
                        {/* Category name badge */}
                        <div className="bg-white/20 rounded-full px-4 py-2 w-fit">
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
                      </div>
                    </Card>
                  </Link>
                );
              })}
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