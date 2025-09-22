import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, User, Mail, Phone, Lock, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    });
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleModeSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    setError("");
  };

  const validateForm = () => {
    if (mode === "login") {
      if (!formData.username || !formData.password) {
        setError("Username and password are required");
        return false;
      }
    } else {
      if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        setError("All required fields must be filled");
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError("Please enter a valid email address");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    // Check password complexity (backend requirement)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must contain at least one lowercase letter, one uppercase letter, one number and one special character (!@#$%^&*)");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const response = await authService.login({
          username: formData.username,
          password: formData.password,
        });

        // Update AuthContext
        login({
          id: response.user.id,
          name: response.user.username,
          email: response.user.email,
          loyaltyLevel: 1,
        });

        handleClose();
      } else {
        const response = await authService.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: "user",
        });

        // Registration successful, now automatically log in the user
        const loginResponse = await authService.login({
          username: formData.username,
          password: formData.password,
        });

        // Update AuthContext
        login({
          id: loginResponse.user.id,
          name: loginResponse.user.username,
          email: loginResponse.user.email,
          loyaltyLevel: 1,
        });

        handleClose();
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError("Invalid username or password");
      } else if (error.response?.status === 409) {
        setError("An account with this username already exists");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || error.message;
        if (message.includes("Password must contain")) {
          setError("Password must contain at least one lowercase letter, one uppercase letter, one number and one special character (!@#$%^&*)");
        } else {
          setError(message || "Invalid request. Please check your information.");
        }
      } else if (error.message?.includes("fetch")) {
        setError("Unable to connect to server. Please try again later.");
      } else {
        setError(`Authentication failed: ${error.message || "Please try again."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user starts typing
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Test Credentials for Demo */}
          {mode === "login" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Demo Credentials:
              </p>
              <p className="text-xs text-blue-700">Email: demo@faredown.com</p>
              <p className="text-xs text-blue-700">Password: password123</p>
            </div>
          )}

          {/* Username Field (Login only) */}
          {mode === "login" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Register Fields */}
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          {/* Phone (Register only) */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number (optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "register" ? "Create a password (8+ characters)" : "Enter your password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register only) */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              mode === "login" ? "Sign in" : "Create account"
            )}
          </Button>

          {/* Forgot Password (Login only) */}
          {mode === "login" && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => {
                  // TODO: Implement forgot password
                  alert("Forgot password functionality coming soon!");
                }}
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Social Login Options */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full py-3 flex items-center justify-center space-x-2"
              onClick={() => alert("Google login coming soon!")}
            >
              <span>🇬</span>
              <span className="text-xs">Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full py-3 flex items-center justify-center space-x-2"
              onClick={() => alert("Apple login coming soon!")}
            >
              <span>🍏</span>
              <span className="text-xs">Apple</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full py-3 flex items-center justify-center space-x-2"
              onClick={() => alert("Facebook login coming soon!")}
            >
              <span>📘</span>
              <span className="text-xs">Facebook</span>
            </Button>
          </div>

          {/* Terms and Conditions */}
          <div className="text-xs text-gray-500 text-center">
            By {mode === "login" ? "signing in" : "creating an account"}, you agree with our{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms & conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy statement
            </a>
          </div>

          {/* Mode Switch */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              {mode === "login" ? "Create account" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
