
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAdmin, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
