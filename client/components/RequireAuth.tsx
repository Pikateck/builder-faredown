import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEnhancedAuthGuard } from "@/utils/enhancedAuthGuards";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
  /** Use inline authentication instead of redirect for certain flows */
  useInlineAuth?: boolean;
  /** Intent type for authentication tracking */
  intent?: 'BARGAIN' | 'CHECKOUT';
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  redirectTo = "/login",
  showLoading = true,
  useInlineAuth = false,
  intent
}) => {
  const { isLoggedIn, user } = useAuth();
  const { showInlineAuth } = useEnhancedAuthGuard();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn || !user) {
      if (useInlineAuth && (intent === 'CHECKOUT' || intent === 'BARGAIN')) {
        // For inline auth flows, don't redirect - let the component handle it
        console.log(`Authentication required for ${intent}, using inline flow`);
        return;
      }
      
      // User is not authenticated, redirect to login
      const next = encodeURIComponent(location.pathname + location.search);
      const intentParam = intent ? `&intent=${intent}` : '';
      const loginUrl = `${redirectTo}?next=${next}${intentParam}`;
      
      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'auth_redirect_required', {
          event_category: 'authentication',
          event_label: location.pathname,
          intent: intent || 'unknown'
        });
      }
      
      navigate(loginUrl, { replace: true });
    }
  }, [isLoggedIn, user, navigate, location, redirectTo, useInlineAuth, intent]);

  // For inline auth flows, render children even if not authenticated
  // The children components will handle showing auth banners/modals
  if (!isLoggedIn && useInlineAuth && (intent === 'CHECKOUT' || intent === 'BARGAIN')) {
    return <>{children}</>;
  }

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
