
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const fetchArticlesForSearch = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_date', { ascending: false });

  if (error) {
    console.error('Error fetching articles for search:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const SearchCommand = () => {
  const [searchValue, setSearchValue] = useState('');
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const { data: articles } = useQuery({
    queryKey: ['articles-search'],
    queryFn: fetchArticlesForSearch,
  });

  const filteredArticles = articles?.filter(article => 
    searchValue && (
      article.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchValue.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchValue.toLowerCase()) ||
      article.author_name?.toLowerCase().includes(searchValue.toLowerCase())
    )
  ).slice(0, 6) || [];

  const handleSelect = (slug: string) => {
    navigate(`/article/${slug}`);
    setSearchValue('');
    setShowResults(false);
  };

  const handleInputFocus = () => {
    setShowResults(true);
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="relative w-64">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-md bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>
      
      {showResults && (searchValue || filteredArticles.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50">
          <Command>
            <CommandList className="max-h-[300px]">
              <CommandEmpty>
                {searchValue ? 'No articles found.' : 'Start typing to search...'}
              </CommandEmpty>
              {filteredArticles.length > 0 && (
                <CommandGroup heading="Articles">
                  {filteredArticles.map((article) => (
                    <CommandItem
                      key={article.id}
                      value={article.slug}
                      onSelect={() => handleSelect(article.slug)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{article.title}</span>
                        {article.category && (
                          <span className="text-xs text-muted-foreground">
                            in {article.category}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default SearchCommand;
