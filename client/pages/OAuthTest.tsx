import React, { useState } from 'react';
import { oauthService } from '@/services/oauthService';

export function OAuthTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testGoogleOAuth = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 Testing Google OAuth...');
      console.log('🧪 Current URL:', window.location.href);
      console.log('🧪 User Agent:', navigator.userAgent);
      console.log('🧪 Popup blocker test...');

      // Test if popups are blocked
      const testPopup = window.open('', 'test', 'width=1,height=1');
      if (!testPopup) {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      }
      testPopup.close();

      const response = await oauthService.loginWithGoogle();
      console.log('🧪 OAuth Response:', response);
      setResult(response);
    } catch (err: any) {
      console.error('🧪 OAuth Error:', err);
      setError(err.message || 'OAuth failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">OAuth Debug Test</h1>
        
        <button
          onClick={testGoogleOAuth}
          disabled={isLoading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Google OAuth'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <h3 className="font-bold">Success!</h3>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Debug Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Test Google OAuth" button</li>
            <li>Complete Google sign-in in popup</li>
            <li>Check console logs for detailed flow</li>
            <li>Verify response data shows user information</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
