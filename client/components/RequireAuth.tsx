import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  redirectTo = "/login",
  showLoading = true
}) => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn || !user) {
      // User is not authenticated, redirect to login
      const next = encodeURIComponent(location.pathname + location.search);
      const loginUrl = `${redirectTo}?next=${next}`;
      
      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'auth_redirect_required', {
          event_category: 'authentication',
          event_label: location.pathname
        });
      }
      
      navigate(loginUrl, { replace: true });
    }
  }, [isLoggedIn, user, navigate, location, redirectTo]);

  // Show loading spinner while checking authentication
  if (!isLoggedIn || !user) {
    if (showLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

// Hook to check if user is authenticated without redirecting
export const useRequireAuth = () => {
  const { isLoggedIn, user } = useAuth();
  return {
    isAuthenticated: isLoggedIn && !!user,
    user,
    checkAuth: () => isLoggedIn && !!user
  };
};

export default RequireAuth;
