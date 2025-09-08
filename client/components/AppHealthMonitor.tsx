/**
 * App Health Monitor Component
 * Displays API connectivity status and handles graceful degradation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { apiClient } from '../lib/api';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'checking';
  lastCheck: string;
  responseTime?: number;
  error?: string;
}

interface AppHealthMonitorProps {
  services?: string[];
  checkInterval?: number; // in milliseconds
  showBanner?: boolean;
}

export function AppHealthMonitor({ 
  services = ['loyalty', 'hotels', 'flights', 'transfers', 'sightseeing'],
  checkInterval = 5 * 60 * 1000, // 5 minutes
  showBanner = true
}: AppHealthMonitorProps) {
  const [serviceHealth, setServiceHealth] = useState<Record<string, ServiceHealth>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Check health of a single service
  const checkServiceHealth = useCallback(async (serviceName: string): Promise<ServiceHealth> => {
    const startTime = Date.now();
    
    try {
      const response = await Promise.race([
        apiClient.get(`/${serviceName}/health`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: serviceName,
        status: responseTime > 2000 ? 'degraded' : 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime,
        error: undefined
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        name: serviceName,
        status: 'down',
        lastCheck: new Date().toISOString(),
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Check all services
  const checkAllServices = useCallback(async () => {
    setIsChecking(true);
    
    const healthChecks = await Promise.all(
      services.map(service => checkServiceHealth(service))
    );
    
    const healthMap = healthChecks.reduce((acc, health) => {
      acc[health.name] = health;
      return acc;
    }, {} as Record<string, ServiceHealth>);
    
    setServiceHealth(healthMap);
    setIsChecking(false);
  }, [services, checkServiceHealth]);

  // Initial health check and periodic monitoring
  useEffect(() => {
    checkAllServices();
    
    const interval = setInterval(checkAllServices, checkInterval);
    return () => clearInterval(interval);
  }, [checkAllServices, checkInterval]);

  // Calculate overall system health
  const getOverallHealth = () => {
    const healthValues = Object.values(serviceHealth);
    if (healthValues.length === 0) return 'checking';
    
    if (healthValues.every(h => h.status === 'healthy')) return 'healthy';
    if (healthValues.some(h => h.status === 'down')) return 'degraded';
    return 'degraded';
  };

  const overallHealth = getOverallHealth();
  const hasIssues = overallHealth !== 'healthy';

  // Don't show banner if dismissed or if all services are healthy
  if (!showBanner || bannerDismissed || !hasIssues) {
    return null;
  }

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'down':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'down':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`border-b ${getStatusColor(overallHealth)}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(overallHealth)}
            <div>
              <p className="text-sm font-medium">
                {overallHealth === 'degraded' 
                  ? 'Some services are experiencing issues'
                  : 'Services are running slowly'
                }
              </p>
              <p className="text-xs opacity-75">
                We're using offline mode to ensure you can continue booking. 
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="underline ml-1 hover:no-underline"
                >
                  {showDetails ? 'Hide details' : 'View details'}
                </button>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={checkAllServices}
              disabled={isChecking}
              className="text-xs px-3 py-1 rounded border border-current hover:bg-current hover:text-white transition-colors disabled:opacity-50"
            >
              {isChecking ? 'Checking...' : 'Retry'}
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 hover:opacity-75 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.values(serviceHealth).map((health) => (
                <div key={health.name} className="flex items-center space-x-2">
                  {getStatusIcon(health.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium capitalize truncate">
                      {health.name}
                    </p>
                    <p className="text-xs opacity-75">
                      {health.responseTime ? `${health.responseTime}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {Object.values(serviceHealth).some(h => h.error) && (
              <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                <p className="text-xs font-medium mb-1">Recent Errors:</p>
                <div className="space-y-1">
                  {Object.values(serviceHealth)
                    .filter(h => h.error)
                    .map((health) => (
                      <p key={health.name} className="text-xs opacity-75">
                        <span className="font-medium capitalize">{health.name}:</span> {health.error}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for component-level health monitoring
export function useServiceHealth(serviceName: string) {
  const [health, setHealth] = useState<ServiceHealth>({
    name: serviceName,
    status: 'checking',
    lastCheck: new Date().toISOString()
  });

  const checkHealth = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      await apiClient.get(`/${serviceName}/health`);
      const responseTime = Date.now() - startTime;
      
      setHealth({
        name: serviceName,
        status: responseTime > 2000 ? 'degraded' : 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime
      });
    } catch (error) {
      setHealth({
        name: serviceName,
        status: 'down',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [serviceName]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { health, recheckHealth: checkHealth };
}

// Export types
export type { ServiceHealth };
