import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Code,
  Database,
  Zap
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface TestResult {
  name: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

const APITestDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  const runPricingTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Test Quote Generation',
        endpoint: '/api/pricing/test-quote',
        method: 'POST'
      },
      {
        name: 'Get Markup Rules',
        endpoint: '/api/pricing/markup-rules',
        method: 'GET'
      },
      {
        name: 'Get Promo Codes',
        endpoint: '/api/pricing/promo-codes',
        method: 'GET'
      },
      {
        name: 'Get Analytics',
        endpoint: '/api/pricing/analytics',
        method: 'GET'
      }
    ];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        let response;
        
        if (test.method === 'POST') {
          response = await fetch(`${window.location.origin}${test.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } else {
          response = await fetch(`${window.location.origin}${test.endpoint}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        setTestResults(prev => [...prev, {
          name: test.name,
          success: response.ok,
          data: data,
          duration: duration
        }]);

      } catch (error) {
        const duration = Date.now() - startTime;
        setTestResults(prev => [...prev, {
          name: test.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: duration
        }]);
      }
    }
    
    setIsRunning(false);
  };

  const runSingleQuote = async (quoteType: string) => {
    setIsRunning(true);
    
    const quoteParams = {
      'business-flight': {
        module: 'air',
        baseNetAmount: 5000,
        origin: 'DXB',
        destination: 'LHR',
        serviceClass: 'Business',
        promoCode: 'BUSINESSDEAL'
      },
      'first-flight': {
        module: 'air',
        baseNetAmount: 8000,
        origin: 'JFK',
        destination: 'LAX',
        serviceClass: 'First',
        promoCode: 'FIRSTLUXE'
      },
      '5-star-hotel': {
        module: 'hotel',
        baseNetAmount: 3000,
        destination: 'Dubai',
        hotelCategory: '5-star',
        promoCode: 'FIVESTARSTAY'
      },
      'luxury-transfer': {
        module: 'transfer',
        baseNetAmount: 800,
        origin: 'Dubai Airport',
        destination: 'Dubai Marina',
        serviceType: 'Luxury',
        promoCode: 'LUXURYTREAT'
      }
    };

    const params = quoteParams[quoteType as keyof typeof quoteParams];
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${window.location.origin}/api/pricing/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      setTestResults(prev => [...prev, {
        name: `Single Quote: ${quoteType}`,
        success: response.ok,
        data: data,
        duration: duration
      }]);

    } catch (error) {
      setTestResults(prev => [...prev, {
        name: `Single Quote: ${quoteType}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
    
    setIsRunning(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Test Dashboard</h1>
        <Button 
          onClick={runPricingTests} 
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => runSingleQuote('business-flight')}
              disabled={isRunning}
              className="h-20 flex flex-col"
            >
              <div className="font-semibold">Business Flight</div>
              <div className="text-xs text-gray-500">DXB → LHR + Promo</div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runSingleQuote('first-flight')}
              disabled={isRunning}
              className="h-20 flex flex-col"
            >
              <div className="font-semibold">First Class</div>
              <div className="text-xs text-gray-500">JFK → LAX + Promo</div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runSingleQuote('5-star-hotel')}
              disabled={isRunning}
              className="h-20 flex flex-col"
            >
              <div className="font-semibold">5-Star Hotel</div>
              <div className="text-xs text-gray-500">Dubai + Promo</div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runSingleQuote('luxury-transfer')}
              disabled={isRunning}
              className="h-20 flex flex-col"
            >
              <div className="font-semibold">Luxury Transfer</div>
              <div className="text-xs text-gray-500">Airport → Marina</div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Results ({testResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tests run yet. Click "Run All Tests" to start.
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                      selectedTest === result ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTest(result)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{result.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.duration && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {result.duration}ms
                          </Badge>
                        )}
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Result Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{selectedTest.name}</h3>
                  <Badge variant={selectedTest.success ? 'default' : 'destructive'}>
                    {selectedTest.success ? 'Success' : 'Error'}
                  </Badge>
                </div>
                
                {selectedTest.success ? (
                  <div>
                    <h4 className="font-medium mb-2">Response Data:</h4>
                    
                    {/* Special formatting for quote results */}
                    {selectedTest.data?.data && selectedTest.data.data.length > 0 ? (
                      <div className="space-y-3">
                        {selectedTest.data.data.map((quote: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                            <div className="font-medium text-green-600 mb-2">
                              ✅ {quote.name}
                            </div>
                            {quote.quote && (
                              <div className="text-sm space-y-1">
                                <div>Base: {formatCurrency(quote.quote.baseNetAmount)}</div>
                                <div>Markup: +{formatCurrency(quote.quote.markupRule.value)}</div>
                                {quote.quote.promoCode && (
                                  <div className="text-blue-600">
                                    Promo ({quote.quote.promoCode.code}): 
                                    -{formatCurrency(quote.quote.promoCode.discount)}
                                  </div>
                                )}
                                <div className="font-semibold border-t pt-1">
                                  Final: {formatCurrency(quote.quote.finalPrice)}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(selectedTest.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Error:</h4>
                    <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                      {selectedTest.error}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a test result to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Pricing Engine</h4>
              <div className="space-y-1 text-sm">
                <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/pricing/quote</code></div>
                <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/pricing/bargain</code></div>
                <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/pricing/confirm</code></div>
                <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/pricing/test-quote</code></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Admin Reports</h4>
              <div className="space-y-1 text-sm">
                <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/admin/reports/bookings</code></div>
                <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/admin/reports/analytics</code></div>
                <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/pricing/markup-rules</code></div>
                <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/pricing/promo-codes</code></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APITestDashboard;
