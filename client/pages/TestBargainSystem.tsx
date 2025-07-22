/**
 * Test Bargain System Page
 * Comprehensive demonstration of the Bargain + Promo Code Engine
 * Shows both flight and hotel scenarios with real-time pricing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BargainBox from '@/components/BargainBox';
import PromoCodeInput from '@/components/PromoCodeInput';
import { 
  pricingService, 
  type PricingContext, 
  type FlightPricingFilters, 
  type HotelPricingFilters,
  type PromoDiscount 
} from '@/services/pricingService';
import {
  Plane,
  Building,
  Target,
  Zap,
  CheckCircle,
  Star,
  Calendar,
  Users,
  MapPin,
  Tag,
  DollarSign,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Settings,
  TestTube,
  PlayCircle,
  Clock,
  Award,
  Gift,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Test scenarios
const FLIGHT_SCENARIOS = [
  {
    id: 'flight_1',
    name: 'Mumbai to Dubai - Business Class',
    basePrice: 45000,
    filters: {
      fromCity: 'Mumbai',
      toCity: 'Dubai',
      airline: 'Emirates',
      cabinClass: 'Business',
      travelDate: '2025-03-15',
      passengers: { adults: 1, children: 0, infants: 0 }
    },
    suggestedPromos: ['FLYHIGH100', 'TRAVEL25'],
    description: 'Popular international route with high demand'
  },
  {
    id: 'flight_2',
    name: 'Delhi to London - Economy',
    basePrice: 52000,
    filters: {
      fromCity: 'Delhi',
      toCity: 'London',
      airline: 'British Airways',
      cabinClass: 'Economy',
      travelDate: '2025-04-10',
      passengers: { adults: 2, children: 1, infants: 0 }
    },
    suggestedPromos: ['TRAVEL25'],
    description: 'Long-haul international flight for family'
  },
  {
    id: 'flight_3',
    name: 'Mumbai to Delhi - Economy',
    basePrice: 8500,
    filters: {
      fromCity: 'Mumbai',
      toCity: 'Delhi',
      airline: 'IndiGo',
      cabinClass: 'Economy',
      travelDate: '2025-02-28',
      passengers: { adults: 1, children: 0, infants: 0 }
    },
    suggestedPromos: ['FLYHIGH100'],
    description: 'Domestic route with moderate pricing'
  }
];

const HOTEL_SCENARIOS = [
  {
    id: 'hotel_1',
    name: 'Atlantis The Palm, Dubai',
    basePrice: 18000,
    filters: {
      city: 'Dubai',
      hotel: 'Atlantis The Palm',
      roomCategory: 'Deluxe',
      checkIn: '2025-03-20',
      checkOut: '2025-03-25',
      guests: { adults: 2, children: 1 },
      rooms: 1
    },
    suggestedPromos: ['HOTELFEST', 'TRAVEL25'],
    description: 'Luxury resort with premium amenities'
  },
  {
    id: 'hotel_2',
    name: 'Marina Bay Sands, Singapore',
    basePrice: 22000,
    filters: {
      city: 'Singapore',
      hotel: 'Marina Bay Sands',
      roomCategory: 'Suite',
      checkIn: '2025-05-15',
      checkOut: '2025-05-18',
      guests: { adults: 2, children: 0 },
      rooms: 1
    },
    suggestedPromos: ['HOTELFEST', 'TRAVEL25'],
    description: 'Iconic hotel with infinity pool'
  },
  {
    id: 'hotel_3',
    name: 'The Taj Mahal Palace, Mumbai',
    basePrice: 12000,
    filters: {
      city: 'Mumbai',
      hotel: 'The Taj Mahal Palace',
      roomCategory: 'Deluxe',
      checkIn: '2025-04-05',
      checkOut: '2025-04-07',
      guests: { adults: 2, children: 0 },
      rooms: 1
    },
    suggestedPromos: ['TRAVEL25'],
    description: 'Heritage luxury hotel in South Mumbai'
  }
];

export default function TestBargainSystem() {
  const [activeTab, setActiveTab] = useState('flights');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [currentContext, setCurrentContext] = useState<PricingContext | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);
  const [showBargainBox, setShowBargainBox] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Initialize with first scenario
  useEffect(() => {
    if (!selectedScenario) {
      const scenarios = activeTab === 'flights' ? FLIGHT_SCENARIOS : HOTEL_SCENARIOS;
      if (scenarios.length > 0) {
        setSelectedScenario(scenarios[0].id);
      }
    }
  }, [activeTab, selectedScenario]);

  // Update context when scenario changes
  useEffect(() => {
    if (selectedScenario) {
      const scenarios = activeTab === 'flights' ? FLIGHT_SCENARIOS : HOTEL_SCENARIOS;
      const scenario = scenarios.find(s => s.id === selectedScenario);
      
      if (scenario) {
        const context: PricingContext = {
          basePrice: scenario.basePrice,
          type: activeTab === 'flights' ? 'flight' : 'hotel',
          filters: scenario.filters,
          promo: appliedPromo || undefined
        };
        setCurrentContext(context);
      }
    }
  }, [selectedScenario, activeTab, appliedPromo]);

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setAppliedPromo(null);
    setShowBargainBox(false);
  };

  const handlePromoApplied = (promo: PromoDiscount | null) => {
    setAppliedPromo(promo);
  };

  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };

  const handleStartBargain = () => {
    setShowBargainBox(true);
  };

  const handlePriceAccepted = (finalPrice: number, sessionId: string) => {
    console.log('Price accepted:', finalPrice, sessionId);
    
    // Add to test results
    const result = {
      id: sessionId,
      scenario: selectedScenario,
      type: activeTab,
      originalPrice: currentContext?.basePrice,
      finalPrice,
      savings: (currentContext?.basePrice || 0) - finalPrice,
      savingsPercent: (((currentContext?.basePrice || 0) - finalPrice) / (currentContext?.basePrice || 1) * 100).toFixed(1),
      promoUsed: appliedPromo?.code || null,
      timestamp: new Date()
    };
    
    setTestResults(prev => [result, ...prev]);
    setShowBargainBox(false);
    
    // Show success message
    alert(`Bargain successful! Final price: ₹${finalPrice.toLocaleString()}`);
  };

  const runAutomatedTests = async () => {
    setIsRunningTests(true);
    const results = [];

    try {
      // Test each scenario with different promo codes
      for (const scenario of [...FLIGHT_SCENARIOS, ...HOTEL_SCENARIOS]) {
        for (const promoCode of scenario.suggestedPromos) {
          const context: PricingContext = {
            basePrice: scenario.basePrice,
            type: scenario.id.startsWith('flight') ? 'flight' : 'hotel',
            filters: scenario.filters
          };

          try {
            // Test promo code application
            const promoResult = await pricingService.applyPromoCode(
              promoCode,
              scenario.filters,
              context.type
            );

            if (promoResult.isValid && promoResult.promo) {
              context.promo = promoResult.promo;
            }

            // Test dynamic pricing
            const pricingResult = await pricingService.getDynamicPricing(context);

            // Test bargain validation with recommended price
            const recommendedPrice = pricingResult.bargainRange.recommended;
            const bargainResult = await pricingService.validateBargainPrice(
              recommendedPrice,
              context,
              promoResult.isValid ? promoCode : undefined
            );

            results.push({
              id: `test_${Date.now()}_${Math.random()}`,
              scenario: scenario.name,
              promoCode,
              promoValid: promoResult.isValid,
              bargainPrice: recommendedPrice,
              bargainStatus: bargainResult.status,
              finalPrice: bargainResult.finalPrice,
              savings: scenario.basePrice - (bargainResult.finalPrice || scenario.basePrice),
              timestamp: new Date()
            });

          } catch (error) {
            console.error(`Test failed for ${scenario.name} with ${promoCode}:`, error);
            results.push({
              id: `test_${Date.now()}_${Math.random()}`,
              scenario: scenario.name,
              promoCode,
              error: error.message,
              timestamp: new Date()
            });
          }
        }
      }

      setTestResults(results);
    } catch (error) {
      console.error('Automated tests failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const scenarios = activeTab === 'flights' ? FLIGHT_SCENARIOS : HOTEL_SCENARIOS;
  const currentScenario = scenarios.find(s => s.id === selectedScenario);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <TestTube className="w-8 h-8 text-blue-600" />
          <span>Bargain + Promo Code Engine Test</span>
        </h1>
        <p className="text-gray-600">
          Comprehensive testing environment for dynamic pricing, promo codes, and bargain validation
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Test Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={runAutomatedTests}
              disabled={isRunningTests}
              className="flex items-center space-x-2"
            >
              {isRunningTests ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              <span>Run Automated Tests</span>
            </Button>
            
            <Button variant="outline" onClick={clearTestResults}>
              Clear Results
            </Button>

            <Badge variant="secondary" className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{testResults.length} test results</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="flights" className="flex items-center space-x-2">
            <Plane className="w-4 h-4" />
            <span>Flight Scenarios</span>
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Hotel Scenarios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scenario Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Flight Test Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {FLIGHT_SCENARIOS.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      selectedScenario === scenario.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleScenarioChange(scenario.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{scenario.name}</h3>
                        <Badge variant="outline">₹{scenario.basePrice.toLocaleString()}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{scenario.filters.fromCity} → {scenario.filters.toCity}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{scenario.filters.travelDate}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{scenario.filters.passengers?.adults} adults</span>
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {scenario.suggestedPromos.map(promo => (
                          <Badge key={promo} variant="secondary" className="text-xs">
                            {promo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Test Interface */}
            {currentContext && currentScenario && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-medium">{currentScenario.name}</h3>
                    <div className="text-lg font-bold text-blue-600">
                      Base Price: ₹{currentScenario.basePrice.toLocaleString()}
                    </div>
                  </div>

                  <PromoCodeInput
                    type="flight"
                    filters={currentScenario.filters as FlightPricingFilters}
                    onPromoApplied={handlePromoApplied}
                    onPromoRemoved={handlePromoRemoved}
                    size="sm"
                  />

                  {appliedPromo && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">
                          {appliedPromo.name} Applied
                        </span>
                        <Badge variant="secondary">
                          {appliedPromo.from}-{appliedPromo.to}
                          {appliedPromo.type === 'percent' ? '%' : '₹'} off
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleStartBargain}
                    className="w-full flex items-center space-x-2"
                  >
                    <Target className="w-4 h-4" />
                    <span>Start Bargaining</span>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hotels" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scenario Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Hotel Test Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {HOTEL_SCENARIOS.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      selectedScenario === scenario.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleScenarioChange(scenario.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{scenario.name}</h3>
                        <Badge variant="outline">₹{scenario.basePrice.toLocaleString()}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{scenario.filters.city}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{scenario.filters.checkIn} - {scenario.filters.checkOut}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{scenario.filters.guests?.adults} guests</span>
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {scenario.suggestedPromos.map(promo => (
                          <Badge key={promo} variant="secondary" className="text-xs">
                            {promo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Test Interface */}
            {currentContext && currentScenario && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-medium">{currentScenario.name}</h3>
                    <div className="text-lg font-bold text-blue-600">
                      Base Price: ₹{currentScenario.basePrice.toLocaleString()}
                    </div>
                  </div>

                  <PromoCodeInput
                    type="hotel"
                    filters={currentScenario.filters as HotelPricingFilters}
                    onPromoApplied={handlePromoApplied}
                    onPromoRemoved={handlePromoRemoved}
                    size="sm"
                  />

                  {appliedPromo && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">
                          {appliedPromo.name} Applied
                        </span>
                        <Badge variant="secondary">
                          {appliedPromo.from}-{appliedPromo.to}
                          {appliedPromo.type === 'percent' ? '%' : '₹'} off
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleStartBargain}
                    className="w-full flex items-center space-x-2"
                  >
                    <Target className="w-4 h-4" />
                    <span>Start Bargaining</span>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bargain Box */}
      {showBargainBox && currentContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>Live Bargaining Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <BargainBox
              context={currentContext}
              onPriceAccepted={handlePriceAccepted}
              onCancel={() => setShowBargainBox(false)}
              showPromoInput={false}
              maxAttempts={3}
            />
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Test Results</span>
              <Badge variant="secondary">{testResults.length} results</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Scenario</th>
                    <th className="text-left p-2">Promo</th>
                    <th className="text-left p-2">Original Price</th>
                    <th className="text-left p-2">Final Price</th>
                    <th className="text-left p-2">Savings</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.slice(0, 10).map((result) => (
                    <tr key={result.id} className="border-b">
                      <td className="p-2">
                        <div className="max-w-xs truncate" title={result.scenario}>
                          {result.scenario}
                        </div>
                      </td>
                      <td className="p-2">
                        {result.promoCode ? (
                          <Badge variant="outline" className="text-xs">
                            {result.promoCode}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="p-2">₹{result.originalPrice?.toLocaleString()}</td>
                      <td className="p-2">
                        {result.finalPrice ? `₹${result.finalPrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2">
                        {result.savings ? (
                          <span className="text-green-600">
                            ₹{result.savings.toLocaleString()}
                            {result.savingsPercent && ` (${result.savingsPercent}%)`}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2">
                        {result.error ? (
                          <Badge variant="destructive" className="text-xs">Error</Badge>
                        ) : result.finalPrice ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Success</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {result.bargainStatus || 'Unknown'}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Test Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.length}
                </div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.finalPrice && !r.error).length}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ₹{testResults
                    .filter(r => r.savings)
                    .reduce((sum, r) => sum + r.savings, 0)
                    .toLocaleString()
                  }
                </div>
                <div className="text-sm text-gray-600">Total Savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {testResults.filter(r => r.promoCode).length}
                </div>
                <div className="text-sm text-gray-600">With Promos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
