
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-grow overflow-hidden">
          <AdminSidebar />
          <main className="flex-grow overflow-auto">
            <div className="h-full w-full p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
