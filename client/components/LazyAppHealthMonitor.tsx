/**
 * Lazy-loaded AppHealthMonitor Component
 * Only loads when health issues are detected to optimize bundle size
 */

import React, { Suspense, lazy } from 'react';

// Lazy load the AppHealthMonitor component
const AppHealthMonitor = lazy(() => 
  import('./AppHealthMonitor').then(module => ({
    default: module.AppHealthMonitor
  }))
);

interface LazyAppHealthMonitorProps {
  services?: string[];
  checkInterval?: number;
  showBanner?: boolean;
}

export function LazyAppHealthMonitor(props: LazyAppHealthMonitorProps) {
  const [hasHealthIssues, setHasHealthIssues] = React.useState(false);

  // Quick health check to determine if we need to load the full component
  React.useEffect(() => {
    const quickHealthCheck = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          timeout: 2000 
        });
        setHasHealthIssues(!response.ok);
      } catch {
        setHasHealthIssues(true);
      }
    };

    quickHealthCheck();
  }, []);

  // Don't render anything if no health issues detected
  if (!hasHealthIssues) {
    return null;
  }

  return (
    <Suspense fallback={
      <div className="bg-yellow-50 border-yellow-200 text-yellow-800 border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Checking service status...</span>
          </div>
        </div>
      </div>
    }>
      <AppHealthMonitor {...props} />
    </Suspense>
  );
}

export default LazyAppHealthMonitor;
