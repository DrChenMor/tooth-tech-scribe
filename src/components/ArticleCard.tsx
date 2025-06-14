
import { Link } from 'react-router-dom';
import { Article } from '@/data/articles';
import { ArrowRight } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  index: number;
}

const ArticleCard = ({ article, index }: ArticleCardProps) => {
  return (
    <div className="group animate-fade-in" style={{ animationDelay: `${index * 100}ms`}}>
      <Link to={`/article/${article.slug}`} className="block">
        <div className="overflow-hidden rounded-lg">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out"
          />
        </div>
        <div className="py-4">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">{article.category}</p>
          <h3 className="text-xl font-serif font-bold mt-2 text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
          <p className="mt-2 text-muted-foreground text-sm">{article.excerpt}</p>
          <div className="flex items-center mt-4">
            <img src={article.author.avatarUrl} alt={article.author.name} className="w-8 h-8 rounded-full mr-3" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">{article.author.name}</p>
              <p className="text-muted-foreground">{article.publishedDate}</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ArticleCard;
