#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the current bundle for optimization opportunities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Starting Bundle Analysis...\n');

// Configuration
const clientDir = path.join(__dirname, '..', 'client');
const distDir = path.join(__dirname, '..', 'dist');

// File size analysis
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Analyze source files
function analyzeSourceFiles() {
  console.log('🔍 Analyzing Source Files...\n');

  const analysis = {
    components: { count: 0, size: 0 },
    services: { count: 0, size: 0 },
    pages: { count: 0, size: 0 },
    utils: { count: 0, size: 0 },
    styles: { count: 0, size: 0 },
    total: { count: 0, size: 0 }
  };

  function scanDirectory(dir, category) {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          scanDirectory(fullPath, category);
        } else if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
          const size = getFileSize(fullPath);
          analysis[category].count++;
          analysis[category].size += size;
          analysis.total.count++;
          analysis.total.size += size;
        } else if (file.name.match(/\.(css|scss)$/)) {
          const size = getFileSize(fullPath);
          analysis.styles.count++;
          analysis.styles.size += size;
          analysis.total.count++;
          analysis.total.size += size;
        }
      });
    } catch (error) {
      // Directory doesn't exist, skip
    }
  }

  // Scan different directories
  scanDirectory(path.join(clientDir, 'components'), 'components');
  scanDirectory(path.join(clientDir, 'services'), 'services');
  scanDirectory(path.join(clientDir, 'pages'), 'pages');
  scanDirectory(path.join(clientDir, 'utils'), 'utils');
  scanDirectory(path.join(clientDir, 'styles'), 'styles');

  // Display results
  Object.entries(analysis).forEach(([category, data]) => {
    console.log(`📁 ${category.toUpperCase()}: ${data.count} files, ${formatBytes(data.size)}`);
  });

  return analysis;
}

// Analyze dependencies
function analyzeDependencies() {
  console.log('\n📚 Analyzing Dependencies...\n');

  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});

    console.log(`📦 Production Dependencies: ${deps.length}`);
    console.log(`🔧 Development Dependencies: ${devDeps.length}`);

    // Identify heavy dependencies
    const heavyDeps = deps.filter(dep => 
      dep.includes('react') || 
      dep.includes('chart') || 
      dep.includes('three') || 
      dep.includes('d3') ||
      dep.includes('@radix-ui')
    );

    if (heavyDeps.length > 0) {
      console.log(`\n🏋️  Heavy Dependencies Found:`);
      heavyDeps.forEach(dep => console.log(`  - ${dep}`));
    }

    return { deps, devDeps, heavyDeps };
  } catch (error) {
    console.log('❌ Could not analyze package.json');
    return { deps: [], devDeps: [], heavyDeps: [] };
  }
}

// Find optimization opportunities
function findOptimizations() {
  console.log('\n🎯 Optimization Opportunities...\n');

  const opportunities = [];

  // Check for large components
  try {
    const componentsDir = path.join(clientDir, 'components');
    const files = fs.readdirSync(componentsDir, { recursive: true, withFileTypes: true });
    
    files.forEach(file => {
      if (file.isFile() && file.name.match(/\.(tsx|ts)$/)) {
        const fullPath = path.join(componentsDir, file.name);
        const size = getFileSize(fullPath);
        
        if (size > 10000) { // > 10KB
          opportunities.push(`📄 Large component: ${file.name} (${formatBytes(size)}) - Consider splitting`);
        }
      }
    });
  } catch (error) {
    // Skip if components directory doesn't exist
  }

  // Check for unused imports (basic check)
  opportunities.push('🔍 Run unused import analysis: npx unimported');
  opportunities.push('📊 Run bundle analyzer: npx vite-bundle-analyzer dist');
  opportunities.push('🌳 Tree-shake unused exports from barrel files');
  opportunities.push('⚡ Lazy load non-critical components');
  opportunities.push('🖼️  Optimize images with next-gen formats (WebP, AVIF)');
  opportunities.push('📦 Split vendor chunks for better caching');

  return opportunities;
}

// Generate recommendations
function generateRecommendations(sourceAnalysis, depAnalysis, opportunities) {
  console.log('\n💡 Recommendations...\n');

  const recommendations = [];

  // Size-based recommendations
  if (sourceAnalysis.total.size > 500000) { // > 500KB
    recommendations.push('🚨 Large codebase detected - implement code splitting');
  }

  if (sourceAnalysis.components.size > 200000) { // > 200KB
    recommendations.push('🧩 Components are large - break into smaller modules');
  }

  if (sourceAnalysis.services.size > 100000) { // > 100KB
    recommendations.push('🔧 Services are large - consider lazy loading');
  }

  // Dependency recommendations
  if (depAnalysis.heavyDeps.length > 5) {
    recommendations.push('📚 Many heavy dependencies - audit for necessity');
  }

  // Output recommendations
  if (recommendations.length > 0) {
    recommendations.forEach(rec => console.log(rec));
  } else {
    console.log('✅ Bundle size looks good - no major optimizations needed');
  }

  // Output opportunities
  console.log('\n🎯 Action Items:');
  opportunities.forEach(opp => console.log(opp));

  return recommendations;
}

// Check dist folder if it exists
function analyzeBuildOutput() {
  console.log('\n🏗️  Build Output Analysis...\n');

  if (!fs.existsSync(distDir)) {
    console.log('⚠️  No build output found. Run `npm run build` first.');
    return null;
  }

  try {
    const distFiles = fs.readdirSync(distDir, { recursive: true, withFileTypes: true });
    let totalSize = 0;
    const fileTypes = { js: 0, css: 0, html: 0, other: 0 };

    distFiles.forEach(file => {
      if (file.isFile()) {
        const fullPath = path.join(distDir, file.name);
        const size = getFileSize(fullPath);
        totalSize += size;

        if (file.name.endsWith('.js')) fileTypes.js += size;
        else if (file.name.endsWith('.css')) fileTypes.css += size;
        else if (file.name.endsWith('.html')) fileTypes.html += size;
        else fileTypes.other += size;
      }
    });

    console.log(`📦 Total Build Size: ${formatBytes(totalSize)}`);
    console.log(`📄 JavaScript: ${formatBytes(fileTypes.js)}`);
    console.log(`🎨 CSS: ${formatBytes(fileTypes.css)}`);
    console.log(`📰 HTML: ${formatBytes(fileTypes.html)}`);
    console.log(`📁 Other: ${formatBytes(fileTypes.other)}`);

    // Size warnings
    if (totalSize > 1000000) { // > 1MB
      console.log('\n⚠️  Build size is large - consider optimization');
    }

    return { totalSize, fileTypes };
  } catch (error) {
    console.log('❌ Could not analyze build output');
    return null;
  }
}

// Main analysis function
function runAnalysis() {
  const sourceAnalysis = analyzeSourceFiles();
  const depAnalysis = analyzeDependencies();
  const buildAnalysis = analyzeBuildOutput();
  const opportunities = findOptimizations();
  const recommendations = generateRecommendations(sourceAnalysis, depAnalysis, opportunities);

  // Summary
  console.log('\n📊 Analysis Summary\n');
  console.log('='.repeat(50));
  console.log(`Source Files: ${sourceAnalysis.total.count} files, ${formatBytes(sourceAnalysis.total.size)}`);
  console.log(`Dependencies: ${depAnalysis.deps.length} production, ${depAnalysis.devDeps.length} dev`);
  
  if (buildAnalysis) {
    console.log(`Build Output: ${formatBytes(buildAnalysis.totalSize)}`);
  }

  console.log(`Optimization Opportunities: ${opportunities.length}`);
  console.log('='.repeat(50));

  // Export results for CI/CD
  const results = {
    source: sourceAnalysis,
    dependencies: depAnalysis,
    build: buildAnalysis,
    opportunities,
    recommendations,
    timestamp: new Date().toISOString()
  };

  if (process.env.CI) {
    console.log('\n📋 CI/CD Results:');
    console.log(JSON.stringify(results, null, 2));
  }

  // Save results to file
  try {
    fs.writeFileSync(
      path.join(__dirname, '..', 'bundle-analysis-results.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('\n💾 Results saved to bundle-analysis-results.json');
  } catch (error) {
    console.log('\n⚠️  Could not save results to file');
  }

  console.log('\n✅ Bundle analysis complete!');
}

// Run the analysis
runAnalysis();
