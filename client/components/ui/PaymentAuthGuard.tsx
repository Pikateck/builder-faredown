import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Lock, Shield } from "lucide-react";

interface PaymentAuthGuardProps {
  /** The payment button/form content to guard */
  children: React.ReactNode;
  /** Called when user successfully completes payment after authentication */
  onPaymentAuthorized?: () => void;
  /** Whether to show the guard as a overlay or replace the content */
  mode?: "overlay" | "replace";
  /** Custom message for the authentication prompt */
  authMessage?: string;
  /** Payment amount for display */
  paymentAmount?: string;
  /** Whether payment is in progress */
  processing?: boolean;
}

export function PaymentAuthGuard({
  children,
  onPaymentAuthorized,
  mode = "overlay",
  authMessage = "Sign in to complete your payment securely",
  paymentAmount,
  processing = false
}: PaymentAuthGuardProps) {
  const { isLoggedIn, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // If user is logged in, render children normally
  if (isLoggedIn && user) {
    return <>{children}</>;
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onPaymentAuthorized?.();
    
    // Track payment authorization success
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'payment_auth_success', {
        event_category: 'authentication',
        event_label: 'payment_guard',
        value: paymentAmount || 0
      });
    }
  };

  const handleAuthRequired = () => {
    setAuthModalMode("login");
    setShowAuthModal(true);

    // Track payment authentication required
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'payment_auth_required', {
        event_category: 'authentication',
        event_label: 'payment_guard',
        value: paymentAmount || 0
      });
    }
  };

  if (mode === "replace") {
    // Replace content entirely with auth prompt
    return (
      <div className="text-center py-8 px-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Secure Payment Required
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {authMessage}
        </p>
        
        {paymentAmount && (
          <div className="inline-flex items-center space-x-2 bg-green-50 text-green-800 px-4 py-2 rounded-lg mb-6">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Amount: {paymentAmount}</span>
          </div>
        )}
        
        <Button
          onClick={handleAuthRequired}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          disabled={processing}
        >
          <Lock className="w-4 h-4 mr-2" />
          Sign In to Pay
        </Button>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Overlay mode - render children with click interceptor
  return (
    <div className="relative">
      {/* Render children but make them non-interactive */}
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
      
      {/* Overlay with auth prompt */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <div className="text-center py-6 px-6 max-w-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Sign In Required
          </h4>
          
          <p className="text-gray-600 text-sm mb-4">
            {authMessage}
          </p>
          
          {paymentAmount && (
            <div className="inline-flex items-center space-x-2 bg-green-50 text-green-800 px-3 py-1 rounded text-sm mb-4">
              <Shield className="w-3 h-3" />
              <span className="font-medium">{paymentAmount}</span>
            </div>
          )}
          
          <Button
            onClick={handleAuthRequired}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            disabled={processing}
          >
            <Lock className="w-4 h-4 mr-2" />
            Sign In to Pay
          </Button>
        </div>
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default PaymentAuthGuard;
