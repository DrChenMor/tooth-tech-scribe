
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
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
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
    setOpen(false);
    setSearchValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-64 justify-start text-muted-foreground bg-muted/50 border-border hover:bg-muted/70"
        >
          <Search className="mr-2 h-4 w-4" />
          Search for...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search articles..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
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
      </PopoverContent>
    </Popover>
  );
};

export default SearchCommand;
