
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const isMainDashboard = location.pathname === '/admin';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </main>
          {isMainDashboard && <Footer />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
