import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

interface FlightResult {
  id: string;
  flightNumber: string;
  airline: {
    code: string;
    name: string;
    logo: string;
  };
  departure: {
    airport: string;
    time: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    time: string;
    terminal?: string;
  };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  cabinClass: string;
  isLiveData: boolean;
  supplier: string;
}

interface AmadeusTestResult {
  success: boolean;
  data?: FlightResult[];
  error?: string;
  message?: string;
  flightCount?: number;
}

export default function AmadeusTestPanel() {
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [searchResult, setSearchResult] = useState<AmadeusTestResult | null>(null);

  const testAmadeusAuth = async () => {
    setIsTestingAuth(true);
    setAuthResult(null);

    try {
      const response = await fetch('/api/test-amadeus-auth');
      const data = await response.json();
      setAuthResult(data);
    } catch (error) {
      setAuthResult({
        success: false,
        error: 'Network error: ' + error.message,
        message: 'Failed to connect to server'
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  const testFlightSearch = async () => {
    setIsTestingSearch(true);
    setSearchResult(null);
    
    try {
      // Test the specific route you mentioned: BOM → DXB, Aug 15, 2025
      const searchParams = new URLSearchParams({
        origin: 'BOM',
        destination: 'DXB', 
        departureDate: '2025-08-15',
        adults: '1'
      });

      const response = await fetch(`/api/flights/search?${searchParams}`);
      const data = await response.json();
      setSearchResult(data);
    } catch (error) {
      setSearchResult({
        success: false,
        error: 'Network error: ' + error.message,
        message: 'Failed to connect to server'
      });
    } finally {
      setIsTestingSearch(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg border">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Amadeus API Test Panel</h2>
        <p className="text-sm text-gray-600 mt-1">
          Test the updated Amadeus sandbox credentials
        </p>
      </div>

      {/* API Keys Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Current API Configuration</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <div>API Key: XpQdwZsr8jOmkvaXFECxqp3NgPj8gbBcOv</div>
          <div>API Secret: xoB9eAjCKQSJJEpgI</div>
          <div>Base URL: https://test.api.amadeus.com</div>
        </div>
      </div>

      {/* OAuth2 Token Test */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">1. OAuth2 Token Test</h3>
          <Button 
            onClick={testAmadeusAuth}
            disabled={isTestingAuth}
            size="sm"
          >
            {isTestingAuth ? 'Testing...' : 'Test Authentication'}
          </Button>
        </div>

        {authResult && (
          <Alert className={authResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={authResult.success ? 'default' : 'destructive'}>
                    {authResult.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  <span className="text-sm font-medium">
                    {authResult.message || (authResult.success ? 'Authentication successful' : 'Authentication failed')}
                  </span>
                </div>
                {authResult.error && (
                  <div className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                    {authResult.error}
                  </div>
                )}
                {authResult.success && authResult.flightCount && (
                  <div className="text-xs text-green-600">
                    Found {authResult.flightCount} flight offers
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Flight Search Test */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">2. Flight Search Test (BOM → DXB, Aug 15, 2025)</h3>
          <Button 
            onClick={testFlightSearch}
            disabled={isTestingSearch}
            size="sm"
          >
            {isTestingSearch ? 'Searching...' : 'Test Flight Search'}
          </Button>
        </div>

        {searchResult && (
          <Alert className={searchResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={searchResult.success ? 'default' : 'destructive'}>
                    {searchResult.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  <span className="text-sm font-medium">
                    {searchResult.message || 'Flight search completed'}
                  </span>
                </div>
                
                {searchResult.error && (
                  <div className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                    {searchResult.error}
                  </div>
                )}
                
                {searchResult.success && searchResult.data && (
                  <div className="space-y-2">
                    <div className="text-xs text-green-600">
                      Found {searchResult.data.length} flights | 
                      Source: {searchResult.source || 'Unknown'} | 
                      Live Data: {searchResult.isLiveData ? 'Yes' : 'No'}
                    </div>
                    
                    {/* Show first 2 flights as examples */}
                    {searchResult.data.slice(0, 2).map((flight, index) => (
                      <div key={flight.id} className="text-xs bg-gray-50 p-2 rounded border">
                        <div className="font-medium">{flight.flightNumber} - {flight.airline.name}</div>
                        <div className="text-gray-600">
                          {flight.departure.airport} → {flight.arrival.airport} | 
                          {flight.duration} | {flight.stops} stops | 
                          {flight.price} {flight.currency} | 
                          {flight.cabinClass} | 
                          Supplier: {flight.supplier}
                        </div>
                        <div className="text-blue-600">
                          Live Data: {flight.isLiveData ? '✅ Yes' : '❌ No (Fallback)'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Status Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Expected Results</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>✅ OAuth2 authentication should succeed with new credentials</div>
          <div>✅ Flight search should return live Amadeus data</div>
          <div>⚠️ If still failing, credentials may need more time to activate (up to 30 minutes)</div>
          <div>📧 Contact Amadeus support if issues persist after 30 minutes</div>
        </div>
      </div>
    </div>
  );
}
