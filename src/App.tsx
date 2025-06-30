import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import ArticlePage from "./pages/ArticlePage";
import ArticlesPage from "./pages/ArticlesPage";
import CategoriesPage from "./pages/CategoriesPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import ArticleEditorPage from "./pages/ArticleEditorPage";
import AIContentGeneratorPage from "./pages/AIContentGeneratorPage";
import AIAgentAdvancedPage from "./pages/AIAgentAdvancedPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import WorkflowBuilderPage from "./pages/WorkflowBuilderPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AdminLayout from "./layouts/AdminLayout";
import MainLayout from "./layouts/MainLayout";
import CategoryPage from "./pages/CategoryPage";
import SitemapPage from "./pages/SitemapPage";
import AICoPilotPage from "./pages/AICoPilotPage";
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPage';
import AutomatedWorkflowsPage from './pages/AutomatedWorkflowsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AIAgentManagementPage from './pages/AIAgentManagementPage';
import ArticlesManagementPage from './pages/ArticlesManagementPage';
import ScrollToTop from './components/ScrollToTop'; // Add this import
import { useGlobalTheme } from './hooks/useGlobalTheme';


const queryClient = new QueryClient();

function App() {
  useGlobalTheme(); // ← Add this line!
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop /> {/* Add this component inside BrowserRouter */}
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/article/:slug" element={<ArticlePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/category/:category" element={<CategoryPage />} />
              </Route>

              <Route path="/auth" element={<AuthPage />} />

              <Route path="/sitemap.xml" element={<SitemapPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Outlet />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/ai-copilot" element={<AICoPilotPage />} />
                <Route path="/admin/analytics" element={<AnalyticsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/workflow-builder" element={<WorkflowBuilderPage />} />
                <Route path="/admin/editor" element={<ArticleEditorPage />} />
                <Route path="/admin/editor/:articleId" element={<ArticleEditorPage />} />
                <Route path="/admin/ai-generator" element={<AIContentGeneratorPage />} />
                <Route path="/admin/ai-agent-advanced" element={<AIAgentAdvancedPage />} />
                <Route path="/admin/performance-analytics" element={<PerformanceAnalyticsPage />} />
                <Route path="/admin/automated-workflows" element={<AutomatedWorkflowsPage />} />
                <Route path="/admin/ai-agents" element={<AIAgentManagementPage />} />
                <Route path="/admin/articles" element={<ArticlesManagementPage />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;