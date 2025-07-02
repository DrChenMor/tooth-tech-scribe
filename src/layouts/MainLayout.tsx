// src/layouts/MainLayout.tsx

import { AppSidebar } from '@/components/AppSidebar';
import Header from '@/components/Header'; // Assuming Header is your TopNavigation
import { SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
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
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;