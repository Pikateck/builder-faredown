import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

export function AuthTest() {
  const { isLoggedIn, user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Main App Auth Test</h2>

      {isLoggedIn ? (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <h3 className="font-semibold text-green-800">
              ✅ Logged In Successfully!
            </h3>
            <div className="mt-2 text-sm text-green-700 space-y-1">
              <div>
                <strong>Name:</strong> {user?.name}
              </div>
              <div>
                <strong>Email:</strong> {user?.email}
              </div>
              <div>
                <strong>ID:</strong> {user?.id}
              </div>
              <div>
                <strong>Loyalty Level:</strong> {user?.loyaltyLevel}
              </div>
            </div>
          </div>

          <Button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            Logout
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-gray-700">
              Not logged in. Test the OAuth integration:
            </p>
          </div>

          <Button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            Open Auth Modal (Test Google Login)
          </Button>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
}
