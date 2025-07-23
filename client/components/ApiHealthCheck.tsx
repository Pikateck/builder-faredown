import React, { useState, useEffect } from 'react';

interface ApiStatus {
  isOnline: boolean;
  message: string;
  endpoint: string;
}

export function ApiHealthCheck() {
  const [status, setStatus] = useState<ApiStatus>({
    isOnline: false,
    message: 'Checking...',
    endpoint: '/api/health'
  });

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setStatus({
          isOnline: true,
          message: `API server is running (${data.status})`,
          endpoint: '/api/health'
        });
      } else {
        setStatus({
          isOnline: false,
          message: 'API server returned non-JSON response',
          endpoint: '/api/health'
        });
      }
    } catch (error) {
      setStatus({
        isOnline: false,
        message: `API server not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`,
        endpoint: '/api/health'
      });
    }
  };

  const getStatusColor = () => {
    return status.isOnline 
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-red-50 border-red-200 text-red-800';
  };

  const getStatusIcon = () => {
    return status.isOnline ? '✅' : '❌';
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${getStatusColor()} mb-4`}>
      <div className="flex items-center gap-2">
        <span>{getStatusIcon()}</span>
        <span className="font-medium">API Server Status</span>
      </div>
      <div className="text-sm mt-1">
        {status.message}
      </div>
      {!status.isOnline && (
        <div className="text-xs mt-2 opacity-75">
          Live Hotelbeds data requires the API server to be running.
          <br />
          Falling back to demo data for now.
        </div>
      )}
      <button
        onClick={checkApiHealth}
        className="text-xs mt-2 px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75"
      >
        🔄 Recheck
      </button>
    </div>
  );
}
