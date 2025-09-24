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
              onClick={handleAppleLogin}
              variant="outline"
              className="w-full py-3 bg-black text-white hover:bg-gray-800"
              disabled={loading}
            >
              <div className="w-5 h-5 bg-white rounded mr-3 flex items-center justify-center">
                <span className="text-black text-xs font-bold">🍎</span>
              </div>
              Continue with Apple
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
              className="w-full py-3 bg-[#FFC107] hover:bg-[#FFB300] text-[#1a1f2c] font-semibold"
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
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <a href="/terms-conditions" className="text-blue-600 hover:underline">
                Terms
              </a>{" "}
              &{" "}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
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
