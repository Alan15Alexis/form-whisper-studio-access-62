
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: JSX.Element;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Get the redirect path from the location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  if (isLoading) {
    // Return loading state while authentication status is being checked
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-gray-300 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-gray-300 rounded col-span-2"></div>
                <div className="h-2 bg-gray-300 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated, only redirect if NOT coming from a direct navigation
  // This allows users to access the login page even when authenticated
  if (isAuthenticated && !location.state?.forceLogin) {
    return <Navigate to={from} replace />;
  }

  // If not authenticated or forced login, render the login page
  return children;
};

export default PublicRoute;
