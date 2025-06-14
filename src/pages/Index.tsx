
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';
import { articles } from '@/data/articles';
import { Link } from 'react-router-dom';

const Index = () => {
  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4">
          <div className="pt-12 pb-16 text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight">Exploring the Future of Dentistry</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Your source for the latest in AI and Dentistry Technology, from industry news to groundbreaking research and clinical tools.
            </p>
          </div>

          {/* Featured Article */}
          <div className="mb-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Link to={`/article/${featuredArticle.slug}`} className="group block md:grid md:grid-cols-2 gap-8 items-center">
              <div className="overflow-hidden rounded-lg">
                <img src={featuredArticle.imageUrl} alt={featuredArticle.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300 ease-in-out" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">{featuredArticle.category}</p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 text-foreground group-hover:text-primary transition-colors">{featuredArticle.title}</h2>
                <p className="mt-4 text-muted-foreground">{featuredArticle.excerpt}</p>
                 <div className="flex items-center mt-4">
                  <img src={featuredArticle.author.avatarUrl} alt={featuredArticle.author.name} className="w-10 h-10 rounded-full mr-3" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">{featuredArticle.author.name}</p>
                    <p className="text-muted-foreground">{featuredArticle.publishedDate}</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Article Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {otherArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
