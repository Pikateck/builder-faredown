import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { BuilderComponent } from "@builder.io/react";
import { initBuilder } from "@/lib/builder";

export default function CmsPage() {
  const { slug } = useParams();
  const location = useLocation();
  const [isBuilderReady, setIsBuilderReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initBuilder();
      setIsBuilderReady(true);
    } catch (err) {
      console.error('Builder initialization failed:', err);
      setError('Failed to initialize Builder.io');
    }
  }, []);

  // Use model "page" by default; Builder resolves by current URL path
  const urlPath = location.pathname;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">CMS Preview Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Path: {urlPath}
          </p>
        </div>
      </div>
    );
  }

  if (!isBuilderReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CMS content...</p>
          <p className="text-sm text-gray-500 mt-2">
            Path: {urlPath}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BuilderComponent
        model="page"
        urlPath={urlPath}
        options={{
          includeRefs: true,
          preview: true,
        }}
      />
    </div>
  );
}
