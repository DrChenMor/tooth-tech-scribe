
import { useParams, Link } from 'react-router-dom';
import { articles } from '@/data/articles';
import NotFound from './NotFound';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, User, Tag } from 'lucide-react';

const ArticlePage = () => {
  const { slug } = useParams();
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
              <Link to="/" className="text-primary font-semibold hover:underline">
                &larr; Back to all articles
              </Link>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mt-4 leading-tight">{article.title}</h1>
              <div className="mt-6 flex justify-center items-center space-x-6 text-muted-foreground text-sm">
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>{article.author.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>{article.publishedDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag size={16} />
                  <span>{article.category}</span>
                </div>
              </div>
            </div>
            <img src={article.imageUrl} alt={article.title} className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg mb-8" />
            <div
              className="prose lg:prose-xl max-w-none mx-auto text-foreground"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticlePage;
