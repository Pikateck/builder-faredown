import React, { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { BuilderComponent } from '@builder.io/react';
import { initBuilder } from '@/lib/builder';

export default function CmsPage() {
  const { slug } = useParams();
  const location = useLocation();

  useEffect(() => {
    initBuilder();
  }, []);

  // Use model "page" by default; Builder resolves by current URL path
  const urlPath = location.pathname;

  return (
    <div className="min-h-screen">
      <BuilderComponent model="page" urlPath={urlPath} />
    </div>
  );
}
