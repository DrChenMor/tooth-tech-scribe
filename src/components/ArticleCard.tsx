
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
    e.currentTarget.src = 'https://via.placeholder.com/400x250/EEE/BDBDBD?text=Denti-AI';
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', article.image_url);
  };

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
      <Link to={`/article/${article.slug}`} className="group block">
        <div className="overflow-hidden rounded-lg mb-4">
          <img 
            src={article.image_url || 'https://via.placeholder.com/400x250/EEE/BDBDBD?text=Denti-AI'} 
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
          <div className="flex items-center mt-4">
            <img 
              src={article.author_avatar_url || undefined} 
              alt={article.author_name || ''} 
              className="w-8 h-8 rounded-full mr-3"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-sm">
              <p className="font-semibold text-foreground">{article.author_name}</p>
              <p className="text-muted-foreground">{format(new Date(article.published_date), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ArticleCard;
