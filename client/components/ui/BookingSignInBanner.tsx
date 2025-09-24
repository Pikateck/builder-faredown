import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingSignInBannerProps {
  /** Called when user successfully signs in */
  onSignInSuccess?: () => void;
  /** Called when user dismisses the banner */
  onDismiss?: () => void;
  /** Show as dismissible banner */
  dismissible?: boolean;
  /** Custom banner message */
  message?: string;
  /** Show the full login form inline */
  expanded?: boolean;
  /** Called when user wants to expand/collapse the form */
  onToggleExpanded?: (expanded: boolean) => void;
}

export function BookingSignInBanner({
  onSignInSuccess,
  onDismiss,
  dismissible = false,
  message = "Sign in to book with your saved details",
  expanded = false,
  onToggleExpanded
}: BookingSignInBannerProps) {
  const { isLoggedIn, login } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(expanded);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Don't show banner if user is already logged in
  if (isLoggedIn) return null;

  const handleToggleForm = () => {
    const newExpanded = !showLoginForm;
    setShowLoginForm(newExpanded);
    onToggleExpanded?.(newExpanded);
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', newExpanded ? 'booking_banner_signin_click' : 'booking_banner_collapse', {
        event_category: 'authentication',
        event_label: 'booking_banner'
      });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Test credentials for demo
      const testCredentials = {
        email: "test@faredown.com",
        password: "password123",
        name: "John Doe"
      };

      if (email === testCredentials.email && password === testCredentials.password) {
        // Successful login
        login({
          id: "test_user_1",
          name: testCredentials.name,
          email: email,
          loyaltyLevel: 1
        });

        // Track login success
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'booking_banner_signin_success', {
            event_category: 'authentication',
            method: 'email',
            event_label: 'booking_banner'
          });
        }

        onSignInSuccess?.();
      } else {
        setError("Invalid email or password. Use test@faredown.com / password123");
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authService.loginWithGoogle();
      
      if (response.success && response.user) {
        login(response.user);
        
        // Track login success
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'booking_banner_signin_success', {
            event_category: 'authentication',
            method: 'google',
            event_label: 'booking_banner'
          });
        }
        
        onSignInSuccess?.();
      } else {
        setError("Google login failed. Please try again.");
      }
    } catch (error) {
      console.error('Google login failed:', error);
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Track banner view
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'booking_banner_view', {
        event_category: 'authentication',
        event_label: 'booking_banner'
      });
    }
  }, []);

  return (
    <div className="mb-6">
      {/* Compact Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {message}
                  </h3>
                  <p className="text-sm text-blue-700">
                    Or register to manage your bookings on the go
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!showLoginForm && (
                <>
                  <Button
                    onClick={handleToggleForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsSignUp(true)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Create account
                  </Button>
                </>
              )}
              
              {dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Login Form */}
          {showLoginForm && (
            <div className="mt-6 pt-4 border-t border-blue-200">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick OAuth */}
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-900">Quick sign in</h4>
                  
                  <Button
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="w-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    disabled={loading}
                  >
                    <div className="flex items-center justify-center w-5 h-5 mr-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    Continue with Google
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white border-[#1877f2] transition-all duration-200"
                    disabled={loading}
                  >
                    <div className="flex items-center justify-center w-5 h-5 mr-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    Continue with Facebook
                  </Button>
                </div>

                {/* Email Form */}
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-900">
                    {isSignUp ? 'Create account' : 'Sign in with email'}
                  </h4>
                  
                  <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        disabled={loading || !email || !password}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {isSignUp ? 'Create Account' : 'Sign In'}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowLoginForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>

                  <div className="text-center">
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign in' 
                        : "Don't have an account? Sign up"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Credentials:</strong> test@faredown.com / password123
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BookingSignInBanner;
