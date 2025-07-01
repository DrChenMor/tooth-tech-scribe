import { Link } from 'react-router-dom';
import { Article } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ArticleCardProps {
  article: Article;
  index: number;
}

const ArticleCard = ({ article, index }: ArticleCardProps) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', article.image_url);
    e.currentTarget.src = 'https://placehold.co/400x250/EEE/BDBDBD?text=Denti-AI';
  };

  const handleImageLoad = () => {
    // This is useful for confirming when an image *does* load.
    // console.log('Image loaded successfully:', article.image_url);
  };
  
  // Debugging log to inspect the URL being passed to the img tag
  if (process.env.NODE_ENV === 'development') {
    console.log(`Article "${article.title}" is using image URL: ${article.image_url}`);
  }

  return (
    <div className="animate-fade-in article-card" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
      <Link to={`/article/${article.slug}`} className="group block">
        <div className="overflow-hidden rounded-lg mb-4">
          <img 
            src={article.image_url || 'https://placehold.co/400x250/EEE/BDBDBD?text=Denti-AI'} 
            alt={article.title} 
            className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </div>
        <div className="py-4">
          {article.category && <Badge variant="outline">{article.category}</Badge>}
          <h3 className="text-xl font-serif font-bold mt-2 text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
          <p className="mt-2 text-muted-foreground">{article.excerpt}</p>
          {/* 🎯 REDUCED SPACING: Changed from mt-4 to mt-2 for tighter spacing */}
          <div className="flex items-center mt-5 article-author-info">
            <img 
              src={article.author_avatar_url || undefined} 
              alt={article.author_name || ''} 
              className="w-8 h-8 rounded-full mr-3"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-sm space-y-0">
              <p className="font-semibold text-foreground leading-none">{article.author_name}</p>
              <p className="text-muted-foreground leading-none">{format(new Date(article.published_date), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ArticleCard;