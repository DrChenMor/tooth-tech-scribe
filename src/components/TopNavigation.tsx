import { Link, useLocation } from 'react-router-dom';
import { Mail, Search, Menu } from 'lucide-react'; // 🍔 ADDED: Menu icon for hamburger
import { Button } from '@/components/ui/button';
import SearchCommand from './SearchCommand';
import { SidebarTrigger } from './ui/sidebar';

const TopNavigation = () => {
  const location = useLocation();

  const navItems = [
    { title: 'Articles', href: '/articles' },
    { title: 'Categories', href: '/categories' },
    { title: 'About Us', href: '/about' },
  ];

  return (
    <nav className="bg-background py-4 px-6 border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 🍔 CUSTOM HAMBURGER: Replace SidebarTrigger with custom hamburger */}
          <div className="block lg:hidden">
            <SidebarTrigger className="mt-1"> {/* 🎯 POSITIONED: mt-1 to move it down slightly */}
              <Menu className="h-6 w-6" /> {/* 🍔 HAMBURGER: Using Menu icon instead of PanelLeft */}
              <span className="sr-only">Toggle Sidebar</span>
            </SidebarTrigger>
          </div>

          {/* 🎨 DARK BLUE COLOR: Changed text color to match sidebar blue */}
          <Link to="/" className="text-2xl font-bold text-blue-900"> {/* Changed from text-foreground to text-blue-900 */}
            DentAI
          </Link>
        </div>
        
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
      } 
      text-sm md:text-base lg:text-md`} // 🔥 RESPONSIVE TEXT SIZES
      // text-sm on small screens, text-base on tablet (md), text-lg on desktop (lg)
    >
      {item.title}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop Search Bar */}
          <div className="hidden lg:block">
            <SearchCommand />
          </div>

          {/* Mobile Search Icon */}
          <div className="block lg:hidden">
            <Button variant="ghost" size="icon" asChild>
                <Link to="/articles">
                    <Search className="w-5 h-5" />
                    <span className="sr-only">Search</span>
                </Link>
            </Button>
          </div>
          
          {/* Shopping Cart Icon */}
          <div className="relative">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">0</span>
            </div>
          </div>

          {/* Subscribe Button */}
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg font-medium p-3 lg:px-6">
            <Mail className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Subscribe</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
