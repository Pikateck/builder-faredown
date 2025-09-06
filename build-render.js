#!/usr/bin/env node

// Simple build script that avoids vite config import issues
import { execSync } from 'child_process';
import { promises as fs } from 'fs';

console.log('🔨 Building for Render deployment...');

try {
  // Ensure output directory
  await fs.mkdir('dist/spa', { recursive: true });

  // Run vite build with no config to avoid import issues
  console.log('🏗️ Running vite build...');
  execSync('npx vite build --outDir dist/spa --emptyOutDir --minify', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
