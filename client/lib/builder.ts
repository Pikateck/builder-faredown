import { builder } from '@builder.io/react';

// Initialize Builder.io with public API key
export function initBuilder() {
  if (!(builder as any)._faredownInitialized) {
    builder.init('4235b10530ff469795aa00c0333d773c');
    (builder as any)._faredownInitialized = true;
  }
}

export { BuilderComponent } from '@builder.io/react';
