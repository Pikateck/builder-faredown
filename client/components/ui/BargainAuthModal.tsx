import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  TrendingDown 
} from "lucide-react";

interface BargainAuthModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should be closed */
  onClose: () => void;
  /** Called when user successfully signs in */
  onSignInSuccess: () => void;
  /** Called when modal opens (for analytics) */
  onModalOpen?: () => void;
}

export function BargainAuthModal({
  isOpen,
  onClose,
  onSignInSuccess,
  onModalOpen
}: BargainAuthModalProps) {
  const { isLoggedIn, login } = useAuth();
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Close modal if user is already logged in
  useEffect(() => {
    if (isLoggedIn && isOpen) {
      onClose();
    }
  }, [isLoggedIn, isOpen, onClose]);

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      onModalOpen?.();
      
      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'bargain_auth_modal_open', {
          event_category: 'authentication',
          event_label: 'bargain_modal'
        });
      }
    }
  }, [isOpen, onModalOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setError("");
      setIsSignUp(false);
      setShowPassword(false);
    }
  }, [isOpen]);

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
          (window as any).gtag('event', 'bargain_auth_success_resume', {
            event_category: 'authentication',
            method: 'email',
            event_label: 'bargain_modal'
          });
        }

        onSignInSuccess();
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
          (window as any).gtag('event', 'bargain_auth_success_resume', {
            event_category: 'authentication',
            method: 'google',
            event_label: 'bargain_modal'
          });
        }
        
        onSignInSuccess();
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

  const handleAppleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Implement Apple OAuth login
      console.log("Apple login not implemented yet");
      setError("Apple login coming soon!");
    } catch (error) {
      console.error('Apple login failed:', error);
      setError("Apple login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-[#FFC107] rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-[#1a1f2c]" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Sign in to start AI bargaining
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Buttons - Premium Design */}
          <div className="space-y-3">
            {/* Google - Primary */}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full py-4 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={loading}
            >
              <div className="flex items-center justify-center w-6 h-6 mr-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span className="font-medium text-gray-700">Continue with Google</span>
            </Button>

            {/* Apple - Premium Black */}
            <Button
              onClick={handleAppleLogin}
              className="w-full py-4 bg-black hover:bg-gray-900 text-white transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={loading}
            >
              <div className="flex items-center justify-center w-6 h-6 mr-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                </svg>
              </div>
              <span className="font-medium">Continue with Apple</span>
            </Button>

            {/* Facebook - Brand Blue */}
            <Button
              onClick={handleFacebookLogin}
              className="w-full py-4 bg-[#1877f2] hover:bg-[#166fe5] text-white transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={loading}
            >
              <div className="flex items-center justify-center w-6 h-6 mr-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="font-medium">Continue with Facebook</span>
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
            </div>

            <div className="space-y-2">
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
            </div>

            <Button
              type="submit"
              className="w-full py-4 bg-[#FFC107] hover:bg-[#FFB300] text-[#1a1f2c] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isSignUp ? 'Create Account & Start Bargaining' : 'Sign In & Start Bargaining'}
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

          {/* Fine Print */}
          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By continuing, you agree to our{" "}
              <a href="/terms-conditions" className="text-blue-600 hover:text-blue-700 underline font-medium">
                Terms
              </a>{" "}
              &{" "}
              <a href="/privacy-policy" className="text-blue-600 hover:text-blue-700 underline font-medium">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BargainAuthModal;
