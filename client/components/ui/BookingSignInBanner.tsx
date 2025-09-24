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
                    className="w-full"
                    disabled={loading}
                  >
                    <img 
                      src="https://developers.google.com/identity/images/g-logo.png" 
                      alt="Google" 
                      className="w-4 h-4 mr-2" 
                    />
                    Continue with Google
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    <div className="w-4 h-4 bg-[#1877f2] rounded mr-2"></div>
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
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
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
