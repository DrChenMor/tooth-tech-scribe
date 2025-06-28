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
import { Home, Info, LayoutGrid, LogIn, LogOut, Mail, Smile, User } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Skeleton } from "./ui/skeleton"

export function AppSidebar() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

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

  const buttonClasses = cn(!isMobile && "justify-center gap-0 group-hover:justify-start group-hover:gap-3");
  const textClasses = cn(isMobile ? "inline-block" : "hidden group-hover:inline-block");
  
  /**
   * THE FINAL FIX: This now handles all states correctly.
   * - Mobile: Left-aligned with large padding.
   * - Desktop (Collapsed): Centered with small padding to prevent icon shrinking.
   * - Desktop (Expanded on Hover): Left-aligned with large padding to match menu items.
   */
  const headerClasses = cn(
    "flex items-center gap-2 text-xl font-bold text-foreground",
    isMobile 
      ? "justify-start px-4" 
      : "justify-center px-2 group-hover:justify-start group-hover:px-5"
  );

  return (
    <Sidebar collapsible="icon" className="[&_[data-sidebar='sidebar']]:rounded-tr-xl">
      <SidebarHeader className="p-4">
        <Link to="/" onClick={handleLinkClick} className={headerClasses}>
          <Smile className="text-primary" size={28} />
          <span className={textClasses}>DentAI</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.href}
                  className={buttonClasses}
                >
                  <Link to={item.href} onClick={handleLinkClick}>
                    <item.icon />
                    <span className={textClasses}>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className={textClasses}>Categories</SidebarGroupLabel>
          <SidebarMenu>
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
                      <LayoutGrid />
                      <span className={textClasses}>{category}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 flex flex-col gap-2">
        {user ? (
          <>
            {isAdmin && (
              <SidebarMenuButton asChild className={cn("w-full", buttonClasses)}>
                <Link to="/admin" onClick={handleLinkClick}>
                  <User />
                  <span className={textClasses}>Admin</span>
                </Link>
              </SidebarMenuButton>
            )}
            <SidebarMenuButton asChild className={cn("w-full", buttonClasses)}>
              <button onClick={() => { handleLogout(); handleLinkClick(); }} className="w-full">
                <LogOut />
                <span className={textClasses}>Logout</span>
              </button>
            </SidebarMenuButton>
          </>
        ) : (
          <SidebarMenuButton asChild className={cn("w-full", buttonClasses)}>
            <Link to="/auth" onClick={handleLinkClick}>
              <LogIn />
              <span className={textClasses}>Login</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}