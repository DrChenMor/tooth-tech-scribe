// src/layouts/MainLayout.tsx

import { AppSidebar } from '@/components/AppSidebar';
import Header from '@/components/Header'; // Assuming Header is your TopNavigation
import FloatingChatWidget from '@/components/FloatingChatWidget';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Outlet, useLocation } from 'react-router-dom';

const MainLayout = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header /> 
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <FloatingChatWidget />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;