import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export function ApiDiagnostic() {
  const [config, setConfig] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('Testing...');

  useEffect(() => {
    const runDiagnostic = async () => {
      try {
        // Get API configuration
        const apiConfig = apiClient.getConfig();
        setConfig(apiConfig);

        // Test API connectivity
        const isConnected = await apiClient.testConnectivity();
        
        if (isConnected) {
          setTestResult('✅ API Connected');
        } else {
          setTestResult('⚠️ API Failed - Using Fallback Mode');
          // Force enable fallback mode
          apiClient.enableFallbackMode();
        }
      } catch (error) {
        setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Force enable fallback mode on error
        apiClient.enableFallbackMode();
      }
    };

    runDiagnostic();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">🔧 API Diagnostic</div>
      <div>Status: {testResult}</div>
      {config && (
        <div className="mt-2 space-y-1">
          <div>Base URL: {config.baseURL || 'None'}</div>
          <div>Environment: {config.isProduction ? 'Production' : 'Development'}</div>
          <div>Fallback Enabled: {config.offlineFallbackEnabled ? 'Yes' : 'No'}</div>
          <div>Force Fallback: {config.forceFallback ? 'Yes' : 'No'}</div>
          <div>Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'Unknown'}</div>
        </div>
      )}
    </div>
  );
}
