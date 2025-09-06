#!/usr/bin/env node

// Standalone build script for Render deployment
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

console.log('🔨 Starting Render build...');

// Ensure dist directory exists
await fs.mkdir('dist/spa', { recursive: true });

// Copy index.html to dist
await fs.copyFile('index.html', 'dist/spa/index.html');

// Use inline vite config to avoid import issues
const viteArgs = [
  'vite', 'build',
  '--outDir', 'dist/spa',
  '--emptyOutDir',
  '--config-file', 'false', // Don't use any config file
  '--mode', 'production'
];

console.log('🏗️ Running vite build...');

const vite = spawn('npx', viteArgs, { 
  stdio: 'inherit',
  shell: true 
});

vite.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build completed successfully!');
  } else {
    console.error('❌ Build failed with code:', code);
    process.exit(1);
  }
});
