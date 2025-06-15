
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
        <div className="flex flex-grow">
          <AdminSidebar />
          <main className="flex-grow p-4 md:p-8">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
