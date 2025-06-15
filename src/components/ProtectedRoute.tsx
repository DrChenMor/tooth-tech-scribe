
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAdmin, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  // NOTE: The following checks are temporarily disabled to allow for a "demo admin" view.
  // To re-enable authentication for admin routes, uncomment the following lines.

  // if (!user) {
  //   return <Navigate to="/auth" state={{ from: location }} replace />;
  // }

  // if (requireAdmin && !isAdmin) {
  //   return <Navigate to="/" replace />;
  // }

  return children;
};

export default ProtectedRoute;
