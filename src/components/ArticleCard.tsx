import { Link } from 'react-router-dom';
import { Article } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface ArticleCardProps {
  article: Article;
  index: number;
}

const ArticleCard = ({ article, index }: ArticleCardProps) => {
  const navigate = useNavigate();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', article.image_url);
    e.currentTarget.src = 'https://placehold.co/400x250/EEE/BDBDBD?text=Denti-AI';
  };

  const handleImageLoad = () => {
    // This is useful for confirming when an image *does* load.
    // console.log('Image loaded successfully:', article.image_url);
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/category/${encodeURIComponent(article.category)}`);
  };
  
  // Debugging log to inspect the URL being passed to the img tag
  if (process.env.NODE_ENV === 'development') {
    console.log(`Article "${article.title}" is using image URL: ${article.image_url}`);
  }

  return (
    <div className="animate-fade-in article-card" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
      <Link to={`/article/${article.slug}`} className="group block">
        {/* Image container with overlay badge */}
        <div className="overflow-hidden rounded-lg mb-4 relative">
          <img 
            src={article.image_url || 'https://placehold.co/400x250/EEE/BDBDBD?text=Denti-AI'} 
            alt={article.title} 
            className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          {/* Category and SEO badges overlay */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {article.category && (
              <button
                onClick={handleCategoryClick}
                className="inline-block"
              >
                <Badge 
                  variant="secondary" 
                  className="bg-[hsl(210,40%,96.1%)]/90 backdrop-blur-sm text-foreground border border-white/20 hover:bg-[hsl(210,40%,88%)] hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  {article.category}
                </Badge>
              </button>
            )}
            {article.seo_score && (
              <Badge 
                variant="outline"
                className={`text-xs font-medium backdrop-blur-sm border border-white/20 ${
                  article.seo_score >= 80 
                    ? 'bg-green-100/90 text-green-800 hover:bg-green-200/90' 
                    : article.seo_score >= 60 
                    ? 'bg-yellow-100/90 text-yellow-800 hover:bg-yellow-200/90' 
                    : 'bg-red-100/90 text-red-800 hover:bg-red-200/90'
                }`}
              >
                SEO: {article.seo_score}/100
                {article.seo_score >= 80 && ' ⭐'}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="py-4">
          {/* Removed the category badge from here since it's now on the image */}
          <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
          <p className="mt-2 text-muted-foreground">{article.excerpt}</p>
          
          {/* Author/Date section with fixed spacing */}
          <div className="flex items-center mt-6 article-author-info">
            <img 
              src={
                article.reporter?.avatar_url || 
                article.author_avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(article.reporter?.name || article.author_name || 'Author')}&size=32`
              } 
              alt={article.reporter?.name || article.author_name || ''} 
              className="w-8 h-8 rounded-full mr-3 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-sm">
              <p className="font-semibold text-foreground">
                {article.reporter?.name || article.author_name}
              </p>
              <p className="text-muted-foreground">
                {format(new Date(article.published_date), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ArticleCard;