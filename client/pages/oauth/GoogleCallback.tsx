/**
 * Google OAuth Callback Page
 * This page is rendered by the backend with popup communication logic
 * This React component serves as a fallback in case direct backend rendering fails
 */

import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";

const GoogleCallback: React.FC = () => {
  useEffect(() => {
    console.log("🔵 React GoogleCallback component mounted");
    console.log("🔵 This should normally be handled by backend HTML response");

    // If we reach this point, it means the backend didn't render the bridge page
    // This is a fallback that tries to close the popup
    if (window.opener) {
      console.log(
        "🔵 Fallback: Attempting to close popup from React component",
      );
      window.opener.postMessage(
        {
          type: "GOOGLE_AUTH_ERROR",
          error: "Authentication flow incomplete. Please try again.",
        },
        "*",
      );

      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      console.log("🔴 No window.opener found in React fallback");
      // Redirect to main app as last resort
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 3000);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Processing
        </h1>
        <p className="text-gray-600">
          Please wait while we complete your sign-in...
        </p>
        <p className="text-sm text-orange-600 mt-4">
          If this page doesn't close automatically, please close it manually and
          try again.
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback;
