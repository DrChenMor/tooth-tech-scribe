import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';

// 🔧 UPDATED: Smart image loading with preload and fallback
const useImageWithFallback = (categoryName: string, fallbackImage: string) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      // If fallbackImage is a database URL, use it directly
      if (fallbackImage && fallbackImage.startsWith('http')) {
        const img = new Image();
        img.onload = () => {
          setImageUrl(fallbackImage);
          setIsLoading(false);
        };
        img.onerror = () => {
          // If database image fails, try legacy method
          tryLegacyImageLoading();
        };
        img.src = fallbackImage;
        return;
      }

      // Legacy method for backward compatibility
      tryLegacyImageLoading();
    };

    const tryLegacyImageLoading = async () => {
      const supabaseUrl = 'https://nuhjsrmkkqtecfkjrcox.supabase.co';
      const slug = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // List of formats to try in order of preference
      const formats = ['png', 'jpg', 'jpeg', 'webp'];
      
      // Try each format until one loads successfully
      for (const format of formats) {
        const testUrl = `${supabaseUrl}/storage/v1/object/public/article-images/category-${slug}.${format}`;
        
        try {
          // Test if the image exists and loads
          const response = await fetch(testUrl, { method: 'HEAD' });
          if (response.ok) {
            // Image exists, verify it actually loads
            const img = new Image();
            img.onload = () => {
              setImageUrl(testUrl);
              setIsLoading(false);
            };
            img.src = testUrl;
            return; // Exit the loop if successful
          } else {
            // Continue to next format or fallback
            continue;
          }
        } catch (error) {
          // Continue to next format
          continue;
        }
      }
      
      // If no Supabase image worked, use fallback
      setImageUrl(fallbackImage);
      setIsLoading(false);
    };

    loadImage();
  }, [categoryName, fallbackImage]);

  return { imageUrl, isLoading };
};

// 🔧 UPDATED: Fallback images with better variety
const getFallbackImage = (index: number): string => {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=250&fit=crop&crop=center', // Medical/General
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop&crop=center', // Industry/Business
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop&crop=center', // Tools/Equipment
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&crop=center', // Tech/Digital
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&crop=center', // AI/Innovation
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop&crop=center', // News/Research
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=250&fit=crop&crop=center', // Default
  ];
  return fallbackImages[index % fallbackImages.length];
};

// Individual category card component for better performance
const CategoryCard = ({ category, index }: { category: { name: string; count: number; image_url?: string }, index: number }) => {
  const fallbackImage = getFallbackImage(index);
  const { imageUrl, isLoading } = useImageWithFallback(category.name, category.image_url || fallbackImage);

  return (
    <Link
      to={`/category/${encodeURIComponent(category.name)}`}
      className="group"
    >
      <Card className="p-0 h-64 border-0 shadow-none transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer relative overflow-hidden">
        
        {/* 🔥 LOADING STATE */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
        
        {/* 🔥 ACTUAL IMAGE - Only shown when loaded */}
        {!isLoading && imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
            style={{ backgroundImage: `url("${imageUrl}")` }}
          />
        )}
        
        {/* Content overlay */}
        <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
          
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
            <div className="bg-black/20 backdrop-blur-sm rounded-full p-2 group-hover:bg-black/30 transition-colors">
              <svg className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const fetchCategoriesWithCounts = async () => {
  // First get categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw new Error(categoriesError.message);
  }

  if (!categories) return [];

  // Then get article counts
  const { data: articleCounts, error: countsError } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null);

  if (countsError) {
    console.error('Error fetching article counts:', countsError);
    // Continue without counts if there's an error
  }

  // Count articles per category
  const countMap = (articleCounts || []).reduce((acc: Record<string, number>, item) => {
    if (item.category) {
      acc[item.category] = (acc[item.category] || 0) + 1;
    }
    return acc;
  }, {});

  // Combine categories with counts
  return categories.map(category => ({
    name: category.name,
    count: countMap[category.name] || 0,
    image_url: category.image_url,
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
                <div key={i} className="h-64 relative overflow-hidden rounded-lg">
                  <Skeleton className="absolute inset-0" />
                  <div className="absolute bottom-4 left-4">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
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
                <CategoryCard 
                  key={category.name} 
                  category={category} 
                  index={index} 
                />
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