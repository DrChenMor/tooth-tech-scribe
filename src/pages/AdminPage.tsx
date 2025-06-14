
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AdminPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome to the admin area. More features coming soon!</p>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
