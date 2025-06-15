import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchCommand from './SearchCommand';

const TopNavigation = () => {
  const location = useLocation();

  const navItems = [
    { title: 'Articles', href: '/articles' },
    { title: 'Categories', href: '/categories' },
    { title: 'About Us', href: '/about' },
  ];

  return (
    <nav className="bg-background py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-foreground">
          Blogle
        </Link>
        
        {/* Navigation Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>

        {/* Search and Subscribe */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:block">
            <SearchCommand />
          </div>
          
          {/* Shopping Cart Icon */}
          <div className="relative">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">0</span>
            </div>
          </div>

          {/* Subscribe Button */}
          <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium">
            <Mail className="w-4 h-4 mr-2" />
            Subscribe
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
