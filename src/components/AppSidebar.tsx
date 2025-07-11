import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useCategories } from "@/hooks/use-categories"
import { cn } from "@/lib/utils"
import { 
  Home, Info, LayoutGrid, LogIn, LogOut, Mail, User, Briefcase, Laptop, Syringe, Sparkles, Newspaper, Microscope, Brain} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Skeleton } from "./ui/skeleton"

export function AppSidebar() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile, open } = useSidebar();

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'general':
        return <Brain className="w-8 h-8" />;
      case 'industry':
        return <Briefcase className="w-8 h-8" />;
      case 'tools':
        return <Syringe className="w-8 h-8" />;
      case 'tech':
        return <Laptop className="w-8 h-8" />;
      case 'ai generated':
        return <Sparkles className="w-8 h-8" />;
      case 'news':
        return <Newspaper className="w-8 h-8" />;
      case 'research':
        return <Microscope className="w-8 h-8" />;
      default:
        return <LayoutGrid className="w-8 h-8" />;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  const mainNav = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'About', href: '/about', icon: Info },
    { title: 'Contact', href: '/contact', icon: Mail },
  ];

  const buttonClasses = cn(
    !isMobile && "justify-center gap-0 group-hover:justify-start group-hover:gap-3"
  );
  
  const textClasses = cn(
    isMobile ? "inline-block" : "hidden group-hover:inline-block", 
    "font-light"
  );
  
  const headerClasses = cn(
    "flex items-center gap-2 text-xl font-light",
    isMobile 
      ? "justify-start px-4" 
      : "justify-center px-2 group-hover:justify-start group-hover:px-5"
  );

return (
    <>
      {/* 🔥 FIX 1: Mobile Overlay with LOWER z-index than sidebar */}
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100]" 
          onClick={() => setOpenMobile(false)}
          style={{ backdropFilter: 'blur(4px)' }}
        />
      )}
      
      {/* 🔥 FIX 2: Sidebar with HIGHER z-index than overlay + proper touch */}
      <Sidebar 
        collapsible="icon" 
        className={cn(
          "border-none text-blue-900",
          "[&_[data-sidebar='sidebar']]:rounded-tr-3xl", 
          "[&_[data-sidebar='sidebar']]:shadow-none hover:[&_[data-sidebar='sidebar']]:shadow-xl",   
          "[&_[data-sidebar='sidebar']]:bg-blue-50",    
          "[&_[data-sidebar='sidebar']_svg]:stroke-[1.2]",
          "lg:[&_[data-sidebar='sidebar']_svg]:stroke-[1.5]",
          // 🔥 FIX 3: Higher z-index for sidebar than overlay + touch events
          isMobile 
            ? "fixed top-0 left-0 h-full z-[110] w-80 max-w-[80vw] pointer-events-auto" 
            : "sticky top-0 h-screen z-[60]"
        )}
        style={{
          // 🔥 FIX 4: Ensure touch events work on mobile/tablet
          pointerEvents: 'auto',
          touchAction: 'manipulation'
        }}
      >
        <SidebarHeader className="p-3">
          <Link 
            to="/" 
            onClick={handleLinkClick} 
            className={cn(
              headerClasses, 
              "items-end",
              isMobile ? "px-4 py-2" : "p-2"
            )}
          >
            <img 
              src="/sidebar-icon.png"
              alt="DentAI logo"
              className="w-8 h-8 mt-1"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              sizes="32px"
              onError={(e) => {
                console.warn('Sidebar icon failed to load');
              }}
              onLoad={() => {
                console.log('Sidebar icon loaded successfully');
              }}
            />
            <span className={textClasses}>DentAI</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-4 overflow-y-auto">
          <SidebarGroup>
            <SidebarMenu className="space-y-1">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                    className={buttonClasses}
                  >
                    <Link to={item.href} onClick={handleLinkClick}>
                      <item.icon className="w-8 h-8" /> 
                      <span className={textClasses}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className={cn(
              textClasses,
              "text-sm font-medium hover:text-primary transition-colors cursor-pointer"
            )}
            asChild
            >
              <Link to="/categories" onClick={handleLinkClick}>
                Categories
              </Link>
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {isLoadingCategories ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              ) : (
                categories?.map((category) => (
                  <SidebarMenuItem key={category}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === `/category/${category}`}
                      className={buttonClasses}
                    >
                      <Link to={`/category/${category}`} onClick={handleLinkClick}>
                        {getCategoryIcon(category)}
                        <span className={textClasses}>{category}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 flex flex-col gap-3">
          {user ? (
            <>
              {isAdmin && (
                <SidebarMenuButton 
                  asChild 
                  className={cn("w-full", buttonClasses)}
                >
                  <Link to="/admin" onClick={handleLinkClick}>
                    <User className="w-8 h-8" />
                    <span className={textClasses}>Admin</span>
                  </Link>
                </SidebarMenuButton>
              )}
              <SidebarMenuButton 
                asChild 
                className={cn("w-full", buttonClasses)}
              >
                <button onClick={() => { handleLogout(); handleLinkClick(); }} className="w-full">
                  <LogOut className="w-8 h-8" />
                  <span className={textClasses}>Logout</span>
                </button>
              </SidebarMenuButton>
            </>
          ) : (
            <SidebarMenuButton 
              asChild 
              className={cn("w-full", buttonClasses)}
            >
              <Link to="/auth" onClick={handleLinkClick}>
                <LogIn className="w-8 h-8" />
                <span className={textClasses}>Login</span>
              </Link>
            </SidebarMenuButton>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  )
}