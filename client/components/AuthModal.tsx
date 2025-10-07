import React, { useEffect, useMemo, useState } from "react";
import {
  StableDialog,
  StableDialogContent,
  StableDialogHeader,
  StableDialogTitle,
} from "@/components/ui/stable-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, Mail, Lock, User, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { oauthService } from "@/services/oauthService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register" | "forgot-password";
}

const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    test: (password: string) => /\d/.test(password),
  },
  {
    id: "special",
    label: "One special character",
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>\-_/\\\[\]+=]/.test(password),
  },
] as const;

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">(
    initialMode,
  );
  const [isChangingMode, setIsChangingMode] = useState(false);

  // Update mode when initialMode changes to prevent flickering
  useEffect(() => {
    if (isOpen && !isChangingMode) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode, isChangingMode]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { login } = useAuth();

  // Simplified form states - email is the identifier like Booking.com
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const passwordChecks = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((requirement) => ({
      id: requirement.id,
      label: requirement.label,
      satisfied: requirement.test(formData.password),
    }));
  }, [formData.password]);

  const isPasswordStrong = useMemo(
    () => passwordChecks.every((check) => check.satisfied),
    [passwordChecks],
  );

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    });
    setError("");
    setSuccess("");
    setShowPassword(false);
    setPasswordFocused(false);
  };

  const handleClose = () => {
    if (isChangingMode) return; // Prevent closing during mode changes
    resetForm();
    setIsChangingMode(false);
    onClose();
  };

  const handleModeSwitch = (
    newMode: "login" | "register" | "forgot-password",
  ) => {
    if (isChangingMode) return; // Prevent rapid changes

    setIsChangingMode(true);
    setError("");
    setSuccess("");
    setMode(newMode);

    // Reset the flag after a short delay
    setTimeout(() => {
      setIsChangingMode(false);
    }, 100);
  };

  const validateForm = () => {
    if (!formData.email) {
      setError("Email address is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (mode === "forgot-password") {
      return true; // Only email needed for forgot password
    }

    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    if (mode === "register") {
      if (!formData.firstName || !formData.lastName) {
        setError("First and last name are required");
        return false;
      }

      if (!isPasswordStrong) {
        setError(
          "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.",
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔵 Form submitted in mode:", mode);
    console.log("🔵 Form data:", {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      passwordLength: formData.password?.length,
    });

    if (!validateForm()) {
      console.log("🔴 Form validation failed");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "forgot-password") {
        console.log("🔵 Processing forgot password...");
        const response = await authService.forgotPassword(formData.email);
        setSuccess(
          "Password reset instructions have been sent to your email address.",
        );
        // Auto switch to login after 3 seconds
        setTimeout(() => setMode("login"), 3000);
      } else if (mode === "login") {
        console.log("🔵 Processing login...");
        const response = await authService.login({
          email: formData.email, // Use email as identifier
          password: formData.password,
        });

        console.log("��� Login response:", response);

        // Update AuthContext
        login({
          id: response.user.id,
          name: response.user.firstName
            ? `${response.user.firstName} ${response.user.lastName}`
            : response.user.email,
          email: response.user.email,
          loyaltyLevel: 1,
        });

        handleClose();
      } else {
        // Register mode
        console.log("🔵 Processing registration...");
        const response = await authService.register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: "user",
        });

        console.log("🔵 Registration response:", response);

        // Auto login after registration
        console.log("🔵 Auto-login after registration...");
        const loginResponse = await authService.login({
          email: formData.email,
          password: formData.password,
        });

        console.log("🔵 Auto-login response:", loginResponse);

        // Update AuthContext
        login({
          id: loginResponse.user.id,
          name: `${formData.firstName} ${formData.lastName}`,
          email: loginResponse.user.email,
          loyaltyLevel: 1,
        });

        console.log("✅ Registration and login completed successfully");
        handleClose();
      }
    } catch (error: any) {
      console.error("Authentication error:", error);

      // Handle different error types
      if (error.response?.status === 401) {
        setError("Invalid email or password");
      } else if (error.response?.status === 409) {
        setError("An account with this email already exists");
      } else if (error.response?.status === 404 && mode === "forgot-password") {
        setError("No account found with this email address");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || error.message;
        setError(message || "Invalid request. Please check your information.");
      } else if (error.message?.includes("fetch")) {
        setError("Unable to connect to server. Please try again later.");
      } else {
        setError(
          `${mode === "forgot-password" ? "Password reset failed" : "Authentication failed"}: ${error.message || "Please try again."}`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "password") {
      setPasswordFocused(true);
    }
    setError(""); // Clear error when user starts typing
    setSuccess(""); // Clear success when user starts typing
  };

  // Social login handlers
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      console.log("🔵 Starting Google OAuth flow...");
      // Try direct method first, fallback to backend route
      let response;
      try {
        response = await oauthService.loginWithGoogleDirect();
      } catch (directError) {
        console.log("🔵 Direct method failed, trying backend route...");
        response = await oauthService.loginWithGoogle();
      }
      console.log("🔵 Google OAuth response:", response);

      if (response.success && response.user) {
        console.log("🔵 Google OAuth success, updating auth context...");
        console.log("🔵 User data received:", response.user);

        // Use the exact format from successful OAuth response
        login({
          id: response.user.id,
          name: response.user.username || response.user.email.split("@")[0],
          email: response.user.email,
          loyaltyLevel: 1,
        });

        console.log("✅ Auth context updated successfully");
        handleClose();
      } else {
        console.error("🔴 Google OAuth failed:", response);
        setError("Google login failed. Please try again.");
      }
    } catch (error: any) {
      console.error("🔴 Google login error:", error);
      setError(error.message || "Google login failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsFacebookLoading(true);
    setError("");

    try {
      console.log("🔵 Starting Facebook OAuth flow...");
      const response = await oauthService.loginWithFacebook();
      console.log("🔵 Facebook OAuth response:", response);

      if (response.success && response.user) {
        console.log("🔵 Facebook OAuth success, updating auth context...");
        login({
          id: response.user.id,
          name:
            response.user.username ||
            response.user.firstName + " " + response.user.lastName,
          email: response.user.email,
          loyaltyLevel: 1,
        });

        handleClose();
      } else {
        console.error("🔴 Facebook OAuth failed:", response);
        setError("Facebook login failed. Please try again.");
      }
    } catch (error: any) {
      console.error("🔴 Facebook login error:", error);
      setError(error.message || "Facebook login failed. Please try again.");
    } finally {
      setIsFacebookLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case "register":
        return "Create your account";
      case "forgot-password":
        return "Reset your password";
      default:
        return "Sign in to your account";
    }
  };

  const getSubmitButtonText = () => {
    if (isLoading) {
      switch (mode) {
        case "register":
          return "Creating account...";
        case "forgot-password":
          return "Sending instructions...";
        default:
          return "Signing in...";
      }
    }

    switch (mode) {
      case "register":
        return "Create account";
      case "forgot-password":
        return "Send reset instructions";
      default:
        return "Sign in";
    }
  };

  return (
    <StableDialog open={isOpen} onOpenChange={handleClose}>
      <StableDialogContent className="max-w-md auth-modal-content auth-modal-immediate">
        <StableDialogHeader>
          <StableDialogTitle className="text-xl font-semibold text-center text-gray-900 auth-modal-title">
            {getModalTitle()}
          </StableDialogTitle>
        </StableDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 auth-modal-form">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Demo Credentials (Login only) */}
          {mode === "login" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Demo Credentials:
              </p>
              <p className="text-xs text-blue-700">Email: demo@faredown.com</p>
              <p className="text-xs text-blue-700">Password: password123</p>
            </div>
          )}

          {/* Name Fields (Register only) */}
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First name
                </label>
                <Input
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  required
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last name
                </label>
                <Input
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  required
                  className="h-12"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              className="h-12"
              autoComplete="email"
            />
          </div>

          {/* Password (not shown for forgot password) */}
          {mode !== "forgot-password" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    mode === "register"
                      ? "Create a password (8+ characters)"
                      : "Enter your password"
                  }
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() =>
                    setPasswordFocused(formData.password.length > 0)
                  }
                  required
                  className="h-12 pr-10"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {mode === "register" && (passwordFocused || formData.password) && (
                <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-600">
                    Password must include all of the following:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
                      <li
                        key={check.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        {check.satisfied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span
                          className={
                            check.satisfied
                              ? "text-sm text-green-700"
                              : "text-sm text-gray-600"
                          }
                        >
                          {check.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {getSubmitButtonText()}
              </>
            ) : (
              getSubmitButtonText()
            )}
          </Button>

          {/* Forgot Password Link (Login only) */}
          {mode === "login" && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline font-medium"
                onClick={() => handleModeSwitch("forgot-password")}
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Back to Login (Forgot Password only) */}
          {mode === "forgot-password" && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline font-medium"
                onClick={() => handleModeSwitch("login")}
              >
                Back to Sign in
              </button>
            </div>
          )}

          {/* Social Login Options (not shown for forgot password) */}
          {mode !== "forgot-password" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    or use one of these options
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Google Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 flex items-center justify-center space-x-2"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  <span>Google</span>
                </Button>

                {/* Facebook Login */}
                <Button
                  type="button"
                  className="h-12 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium flex items-center justify-center space-x-2"
                  onClick={handleFacebookLogin}
                  disabled={isFacebookLoading || isLoading}
                >
                  {isFacebookLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  <span>Facebook</span>
                </Button>
              </div>
            </>
          )}

          {/* Mode Switch */}
          {mode !== "forgot-password" && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() =>
                    handleModeSwitch(mode === "login" ? "register" : "login")
                  }
                  className="text-blue-600 hover:underline font-medium"
                >
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </p>
            </div>
          )}

          {/* Terms and Conditions (Register only) */}
          {mode === "register" && (
            <div className="text-xs text-gray-500 text-center leading-relaxed">
              By creating an account, you agree with our{" "}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms & conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy statement
              </a>
            </div>
          )}
        </form>
      </StableDialogContent>
    </StableDialog>
  );
}
