/**
 * Google OAuth Callback Page
 * Handles Google OAuth redirect and communicates back to parent window
 */

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { oauthService } from '@/services/oauthService';

const GoogleCallback: React.FC = () => {
  useEffect(() => {
    // Handle OAuth redirect
    oauthService.handleOAuthRedirect();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Google Sign-in
        </h1>
        <p className="text-gray-600">
          Please wait while we complete your authentication...
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback;
