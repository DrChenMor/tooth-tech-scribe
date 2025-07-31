// src/layouts/MainLayout.tsx

import { AppSidebar } from '@/components/AppSidebar';
import Header from '@/components/Header'; // Assuming Header is your TopNavigation
import FloatingChatWidget from '@/components/FloatingChatWidget';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Outlet, useLocation } from 'react-router-dom';

const MainLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  return (
    // ✅  FIX: Set the breakpoint to 768px.
    // Tablets (768px+) will now be treated as "desktop".
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          {/* Make sure you are using the correct Header component name */}
          <Header /> 
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        {/* Floating Chat Widget - Hide on chat page to avoid confusion */}
        {!isChatPage && <FloatingChatWidget />}
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;