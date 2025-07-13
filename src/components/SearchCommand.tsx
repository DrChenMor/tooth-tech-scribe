import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';

const fetchArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('published_date', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
  return data || [];
};

const SearchCommand = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: articles = [] } = useQuery({
    queryKey: ['published-articles'], // 🔥 FIX: Use published articles for search
    queryFn: fetchArticles,
  });

  const filteredArticles = searchQuery.trim()
    ? articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSelectArticle = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-64">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          className="
            w-full pl-10 pr-10 py-2.5
            bg-white/90 backdrop-blur-sm 
            border border-gray-200/60 
            rounded-2xl 
            focus:outline-none 
            focus:ring-2 focus:ring-blue-500/20 
            focus:bg-white 
            focus:border-blue-300/60
            focus:shadow-lg focus:shadow-blue-500/10
            transition-all duration-300
            text-sm
            placeholder:text-gray-400
          "
        />
        
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {!isOpen && !searchQuery && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100/80 px-2 py-1 rounded-lg backdrop-blur-sm">
            ⌘K
          </div>
        )}
      </div>

      {/* 🔥 FIX 7: Lower z-index for search dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          
          <div className="
            absolute top-full left-0 right-0 mt-2
            bg-white backdrop-blur-xl
            border border-white/30
            rounded-2xl
            shadow-2xl shadow-black/10
            max-h-96 overflow-y-auto
            z-40
          ">
            {searchQuery.trim() === '' ? (
              <div className="p-6 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Start typing to search articles...
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Use ⌘K to quickly open search
                </p>
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-100/50">
                  Articles ({filteredArticles.length})
                </div>
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.slug}`}
                    onClick={handleSelectArticle}
                    className="
                      block px-4 py-3 
                      hover:bg-blue-50/80 
                      transition-all duration-200
                      border-b border-gray-50/50 last:border-b-0
                      group
                    "
                  >
                    <div className="flex items-start gap-3">
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-12 h-12 object-cover rounded-xl flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {article.title}
                        </h4>
                        {article.excerpt && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        {article.category && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100/80 text-gray-600 rounded-lg">
                            {article.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                
                <div className="px-4 py-3 border-t border-gray-100/50">
                  <Link
                    to={`/articles?search=${encodeURIComponent(searchQuery)}`}
                    onClick={handleSelectArticle}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all results for "{searchQuery}"
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No articles found for "{searchQuery}"
                </p>
                <Link
                  to="/articles"
                  onClick={handleSelectArticle}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                >
                  Browse all articles
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchCommand;