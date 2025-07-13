import { Link, useLocation } from 'react-router-dom';
import { Mail, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchCommand from './SearchCommand';
import { SidebarTrigger } from './ui/sidebar';
import { NewsletterDropdown } from './NewsletterDropdown';

const TopNavigation = () => {
  const location = useLocation();

  const navItems = [
    { title: 'Articles', href: '/articles' },
    { title: 'Categories', href: '/categories' },
    { title: 'About Us', href: '/about' },
  ];

  return (
    // The padding remains the same as it's a good general rule.
    <div className="p-4 lg:p-6">
      <nav className="
        bg-white/80 backdrop-blur-xl 
        rounded-3xl 
        py-4 px-6 
        border border-white/20
        shadow-none
        hover:shadow-2xl hover:shadow-black/10
        transition-all duration-500 ease-out
        hover:-translate-y-1
        relative z-[50]
      ">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* This remains lg:hidden because it's tied to the sidebar's appearance */}
            <div className="block lg:hidden">
              <SidebarTrigger className="mt-1 hover:bg-gray-100/80 rounded-xl p-2 transition-all duration-300">
                <Menu className="h-6 w-6 text-blue-900" />
                <span className="sr-only">Toggle Sidebar</span>
              </SidebarTrigger>
            </div>

            {/* ✅ FIXED: Hide on tablet (md), show on desktop (lg) */}
            <Link 
              to="/" 
              className="
                text-2xl font-bold text-blue-900 
                hover:text-blue-700 transition-colors duration-300 
                block md:hidden lg:block
              "
            >
              DentAI
            </Link>
          </div>
          
          {/* ✅ FIXED: Show nav links on tablet (md) and up */}
          <div className="hidden md:flex md:space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className={`
                  relative px-3 py-2 text-sm lg:text-base font-medium 
                  transition-all duration-300 rounded-2xl
                  hover:bg-blue-50/80 hover:text-blue-600
                  ${location.pathname === item.href
                    ? 'text-blue-600 bg-blue-50/60 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                  }
                  group
                `}
              >
                <span className="relative z-10">{item.title}</span>
                <div className={`
                  absolute inset-0 rounded-2xl transition-all duration-300 transform
                  ${location.pathname === item.href 
                    ? 'bg-blue-50/60 scale-100' 
                    : 'bg-blue-50/80 scale-0 group-hover:scale-100'
                  }
                `} />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* ✅ FIXED: Show full search bar on desktop (lg) and up */}
            <div className="hidden lg:block">
              <SearchCommand />
            </div>

            {/* ✅ FIXED: Show search ICON on tablet (md) and mobile */}
            <div className="block lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-gray-100/80 transition-all duration-300" asChild>
                  <Link to="/articles"> 
                      <Search className="w-5 h-5 text-gray-600" />
                      <span className="sr-only">Search</span>
                  </Link>
              </Button>
            </div>
            
            {/* Newsletter Subscribe Dropdown */}
            <div className="hidden md:block">
              <NewsletterDropdown />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default TopNavigation;