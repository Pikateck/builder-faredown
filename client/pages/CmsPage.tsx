import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { BuilderComponent, builder } from "@builder.io/react";
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
      console.error("Builder initialization failed:", err);
      setError("Failed to initialize Builder.io");
    }
  }, []);

  const builderUrlPath = useMemo(() => {
    const rawPath = location.pathname;

    if (!rawPath || rawPath === "/") {
      return "/";
    }

    if (rawPath === "/cms" || rawPath === "/cms/") {
      return "/";
    }

    if (rawPath.startsWith("/cms/")) {
      const stripped = rawPath.slice(4);
      return stripped.startsWith("/") ? stripped : `/${stripped}`;
    }

    return rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  }, [location.pathname]);

  const builderPreviewUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return builderUrlPath;
    }

    const origin = window.location.origin;
    const search = window.location.search;
    const hash = window.location.hash;

    return `${origin}${builderUrlPath}${search}${hash}`;
  }, [builderUrlPath]);

  useEffect(() => {
    if (!isBuilderReady) {
      return;
    }

    let cancelled = false;

    builder
      .get("page", {
        url: builderPreviewUrl,
        userAttributes: {
          url: builderPreviewUrl,
          urlPath: builderUrlPath,
        },
        options: {
          includeRefs: true,
          preview: true,
        },
      })
      .toPromise()
      .then(result => {
        if (cancelled) {
          return;
        }

        if (!result) {
          setError(
            "No Builder content found for this path. Publish the page or adjust the targeting URL in Builder.io to match."
          );
        } else {
          setError(null);
        }
      })
      .catch(err => {
        if (cancelled) {
          return;
        }

        console.error("Failed to fetch Builder content:", err);
        setError("Unable to load Builder content. Check console for details.");
      });

    return () => {
      cancelled = true;
    };
  }, [builderPreviewUrl, builderUrlPath, isBuilderReady]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            CMS Preview Error
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Requested path: {builderUrlPath}</p>
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
          <p className="text-sm text-gray-500 mt-2">Requested path: {builderUrlPath}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BuilderComponent
        model="page"
        urlPath={builderUrlPath}
        options={{
          includeRefs: true,
          preview: true,
        }}
      />
    </div>
  );
}
