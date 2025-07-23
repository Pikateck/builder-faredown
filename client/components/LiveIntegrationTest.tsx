import React, { useState } from 'react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  data?: any;
  error?: string;
  duration?: number;
}

export function LiveIntegrationTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const runLiveTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    const testResults: TestResult[] = [];

    // Test 1: Hotelbeds Destinations API
    const startDestinations = Date.now();
    try {
      console.log('🧪 Testing live destinations API...');
      
      // Using the real frontend API client to test through our fallback system
      const response = await fetch('/api/hotels/destinations/search?q=Dubai', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        testResults.push({
          name: 'Hotel Destinations Search',
          status: 'success',
          data: {
            count: data.data?.length || 0,
            sample: data.data?.slice(0, 3) || []
          },
          duration: Date.now() - startDestinations
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.push({
        name: 'Hotel Destinations Search',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startDestinations
      });
    }
    
    setResults([...testResults]);

    // Test 2: Hotel Search API
    const startHotels = Date.now();
    try {
      console.log('🧪 Testing live hotel search API...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      
      const searchParams = new URLSearchParams({
        destination: 'Dubai',
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: dayAfter.toISOString().split('T')[0],
        rooms: '1',
        adults: '2',
        children: '0'
      });
      
      const response = await fetch(`/api/hotels/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        testResults.push({
          name: 'Hotel Search',
          status: 'success',
          data: {
            count: data.data?.length || 0,
            sample: data.data?.slice(0, 2) || []
          },
          duration: Date.now() - startHotels
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.push({
        name: 'Hotel Search',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startHotels
      });
    }
    
    setResults([...testResults]);

    // Test 3: Database Health Check
    const startDB = Date.now();
    try {
      console.log('🧪 Testing database connectivity...');
      
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        testResults.push({
          name: 'Database Health',
          status: 'success',
          data: {
            status: data.status,
            database: data.database,
            timestamp: data.timestamp
          },
          duration: Date.now() - startDB
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.push({
        name: 'Database Health',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startDB
      });
    }

    setResults(testResults);
    
    const allSuccessful = testResults.every(test => test.status === 'success');
    setOverallStatus(allSuccessful ? 'success' : 'error');
    setIsRunning(false);

    if (allSuccessful) {
      console.log('🎉 All live integration tests passed!');
    } else {
      console.warn('⚠️ Some integration tests failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusIcon = () => {
    switch (overallStatus) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '🧪';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`border-2 rounded-lg p-4 shadow-lg ${getStatusColor(overallStatus)}`}>
        <div className="font-bold mb-3 text-center">
          {getOverallStatusIcon()} Live API Integration Test
        </div>
        
        {results.length > 0 && (
          <div className="space-y-2 mb-3">
            {results.map((result, index) => (
              <div key={index} className="text-xs border-b pb-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{result.name}</span>
                  <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {result.status === 'success' ? '✅' : '❌'}
                  </span>
                </div>
                
                {result.duration && (
                  <div className="text-gray-500">Duration: {result.duration}ms</div>
                )}
                
                {result.data && (
                  <div className="text-gray-700">
                    {result.data.count !== undefined && (
                      <div>Results: {result.data.count}</div>
                    )}
                    {result.data.status && (
                      <div>Status: {result.data.status}</div>
                    )}
                  </div>
                )}
                
                {result.error && (
                  <div className="text-red-600">Error: {result.error}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={runLiveTests}
          disabled={isRunning}
          className={`w-full px-3 py-2 text-sm rounded font-medium ${
            isRunning 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isRunning ? '🔄 Running Tests...' : '🚀 Test Live APIs'}
        </button>
      </div>
    </div>
  );
}
