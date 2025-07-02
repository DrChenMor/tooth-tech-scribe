import { Link, useLocation } from 'react-router-dom';
import { Mail, Search, Menu } from 'lucide-react';
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
    // 🔥 WRAPPER: Full page padding for floating capsule effect
    <div className="p-4 lg:p-6">
      {/* 🔥 CAPSULE CONTAINER: The entire header as one rounded container */}
      <nav className="
        bg-white/80 backdrop-blur-xl 
        rounded-3xl 
        py-4 px-6 
        shadow-xl shadow-black/5 
        border border-white/20
        hover:shadow-2xl hover:shadow-black/10
        transition-all duration-500 ease-out
        hover:-translate-y-1
      ">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 🍔 CUSTOM HAMBURGER: Preserve your custom hamburger styling */}
            <div className="block lg:hidden">
              <SidebarTrigger className="mt-1 hover:bg-gray-100/80 rounded-xl p-2 transition-all duration-300">
                <Menu className="h-6 w-6 text-blue-900" />
                <span className="sr-only">Toggle Sidebar</span>
              </SidebarTrigger>
            </div>

            {/* 🎨 PRESERVE: Your dark blue branding */}
            <Link to="/" className="text-2xl font-bold text-blue-900 hover:text-blue-700 transition-colors duration-300">
              DentAI
            </Link>
          </div>
          
          {/* Navigation Menu with enhanced hover effects */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className={`
                  relative px-4 py-2 text-sm md:text-base lg:text-md font-medium 
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
                {/* Hover capsule effect */}
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

          {/* Actions with enhanced capsule styling */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Search Bar - RESTORED: Your SearchCommand component */}
            <div className="hidden lg:block">
              <SearchCommand />
            </div>

            {/* Mobile Search Icon with capsule hover */}
            <div className="block lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-gray-100/80 transition-all duration-300" asChild>
                  <Link to="/articles">
                      <Search className="w-5 h-5 text-gray-600" />
                      <span className="sr-only">Search</span>
                  </Link>
              </Button>
            </div>
            
            {/* Shopping Cart Icon with capsule styling */}
            <div className="relative">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 cursor-pointer">
                <span className="text-white font-bold text-sm">0</span>
              </div>
            </div>

            {/* Subscribe Button with enhanced capsule styling */}
            <Button className="
              bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium p-3 lg:px-6
              transition-all duration-300 
              hover:shadow-lg hover:shadow-blue-500/25 
              hover:-translate-y-0.5
              backdrop-blur-sm
            ">
              <Mail className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Subscribe</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default TopNavigation;