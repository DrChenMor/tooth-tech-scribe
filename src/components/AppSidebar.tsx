
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
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useCategories } from "@/hooks/use-categories"
import { Home, Info, LayoutGrid, LogIn, LogOut, Mail, Smile, User } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

export function AppSidebar() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const mainNav = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'About', href: '/about', icon: Info },
    { title: 'Contact', href: '/contact', icon: Mail },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Smile className="text-primary" size={28} />
          <span className="group-data-[collapsible=icon]:hidden group-hover:inline">Dental AI Insights</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                  <Link to={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarMenu>
            {isLoadingCategories ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : (
              categories?.map((category) => (
                <SidebarMenuItem key={category}>
                  <SidebarMenuButton asChild isActive={location.pathname === `/category/${category}`}>
                    <Link to={`/category/${category}`}>
                      <LayoutGrid />
                      <span>{category}</span>
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
            {isAdmin && <Button asChild variant="outline" size="sm" className="w-full group-data-[collapsible=icon]:hidden group-hover:block"><Link to="/admin">Admin</Link></Button>}
            <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full group-data-[collapsible=icon]:hidden group-hover:block">Logout</Button>
            
            <SidebarMenuButton asChild className="w-full hidden group-data-[collapsible=icon]:flex group-hover:hidden">
                <Link to="/admin"><User /></Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild className="w-full hidden group-data-[collapsible=icon]:flex group-hover:hidden">
                <button onClick={handleLogout} className="w-full flex justify-center"><LogOut /></button>
            </SidebarMenuButton>
          </>
        ) : (
          <>
            <Button asChild size="sm" className="w-full group-data-[collapsible=icon]:hidden group-hover:block"><Link to="/auth">Login</Link></Button>
            <SidebarMenuButton asChild className="w-full hidden group-data-[collapsible=icon]:flex group-hover:hidden">
                <Link to="/auth"><LogIn /></Link>
            </SidebarMenuButton>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
