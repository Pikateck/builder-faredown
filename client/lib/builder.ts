import { builder, Builder } from "@builder.io/react";

// Initialize Builder.io with public API key and proper configuration
export function initBuilder() {
  if (!(builder as any)._faredownInitialized) {
    builder.init("4235b10530ff469795aa00c0333d773c");

    // Configure Builder for preview mode
    builder.canTrack = false; // Disable tracking for CMS mode

    // Enable preview mode if in Builder environment
    if (typeof window !== 'undefined') {
      const isBuilderPreview = window.location.search.includes('builder.preview') ||
                               window.location.hostname.includes('builder.io') ||
                               window.parent !== window; // Inside iframe

      if (isBuilderPreview) {
        builder.previewingModel = 'page';
      }
    }

    (builder as any)._faredownInitialized = true;
    console.log('✅ Builder.io initialized for Faredown CMS');
  }
}

export { BuilderComponent, Builder } from "@builder.io/react";
