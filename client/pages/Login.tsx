import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { resumePostAuth } from "@/utils/authGuards";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowLeft 
} from "lucide-react";
import { authService } from "@/services/authService";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Resume flow states
  const [resuming, setResuming] = useState(false);
  const nextPath = searchParams.get('next');
  const intent = searchParams.get('intent') as 'BARGAIN' | 'CHECKOUT' | null;

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      handlePostLogin();
    }
  }, [isLoggedIn]);

  const handlePostLogin = async () => {
    if (nextPath && intent) {
      setResuming(true);
      try {
        const success = await resumePostAuth(nextPath, intent);
        if (success) {
          navigate(nextPath);
        } else {
          // Resume failed, redirect to appropriate fallback
          navigate(getDefaultRedirect());
        }
      } catch (error) {
        console.error('Resume flow failed:', error);
        navigate(getDefaultRedirect());
      } finally {
        setResuming(false);
      }
    } else {
      // No resume flow, redirect to default
      navigate(getDefaultRedirect());
    }
  };

  const getDefaultRedirect = () => {
    // Default redirects based on intent
    switch (intent) {
      case 'BARGAIN':
        return '/flights'; // Or last visited module
      case 'CHECKOUT':
        return '/account'; // User's bookings
      default:
        return '/account'; // Default to account page
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
          (window as any).gtag('event', 'login_success', {
            event_category: 'authentication',
            method: 'email',
            intent: intent || 'direct'
          });
        }
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
      // Implement Google OAuth login
      const response = await authService.loginWithGoogle();
      
      if (response.success && response.user) {
        login(response.user);
        
        // Track login success
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'login_success', {
            event_category: 'authentication',
            method: 'google',
            intent: intent || 'direct'
          });
        }
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

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Implement Facebook OAuth login
      console.log("Facebook login not implemented yet");
      setError("Facebook login coming soon!");
    } catch (error) {
      console.error('Facebook login failed:', error);
      setError("Facebook login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (resuming) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Resuming Your Session
            </h2>
            <p className="text-gray-600">
              {intent === 'BARGAIN' 
                ? 'Opening AI bargaining session...' 
                : 'Proceeding to checkout...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Link to="/" className="flex items-center text-blue-600 hover:text-blue-700">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Faredown
              </Link>
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            
            {intent && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {intent === 'BARGAIN' 
                    ? '🎯 Sign in to start AI bargaining' 
                    : '🛒 Sign in to complete your booking'}
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full py-3"
                disabled={loading}
              >
                <img 
                  src="https://developers.google.com/identity/images/g-logo.png" 
                  alt="Google" 
                  className="w-5 h-5 mr-3" 
                />
                Continue with Google
              </Button>

              <Button
                onClick={handleFacebookLogin}
                variant="outline"
                className="w-full py-3"
                disabled={loading}
              >
                <div className="w-5 h-5 bg-[#1877f2] rounded mr-3"></div>
                Continue with Facebook
              </Button>
            </div>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                or
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
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
              </div>

              <Button
                type="submit"
                className="w-full py-3"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Demo Credentials:</strong><br />
                Email: test@faredown.com<br />
                Password: password123
              </p>
            </div>

            {/* Toggle Sign Up / Sign In */}
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

            {/* Help Links */}
            <div className="text-center space-y-2">
              <Link 
                to="/help-center" 
                className="text-sm text-gray-600 hover:text-gray-900 block"
              >
                Need help?
              </Link>
              <Link 
                to="/privacy-policy" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-400 mx-2">•</span>
              <Link 
                to="/terms-conditions" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Terms of Service
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
