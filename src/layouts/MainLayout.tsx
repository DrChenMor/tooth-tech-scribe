import { AppSidebar } from '@/components/AppSidebar';
import Header from '@/components/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      {/* ✅ FIX: Removed overflow-hidden to allow sticky positioning to work */}
      <div className="flex min-h-screen w-full bg-background"> {/* bg-background is a good practice */}
        
        {/* This will now be sticky to the viewport's edge */}
        <AppSidebar />
        
        {/* This container will hold the scrollable content */}
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          {/* This main area is correctly set to scroll */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;