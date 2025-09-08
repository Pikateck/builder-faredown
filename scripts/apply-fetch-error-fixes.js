#!/usr/bin/env node

/**
 * Script to apply fetch error fixes
 * This will replace the problematic files with fixed versions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 Applying fetch error fixes...');

// File mappings: [source_fixed_file, target_original_file]
const filesToReplace = [
  ['client/lib/api.fixed.ts', 'client/lib/api.ts'],
  ['client/services/loyaltyService.fixed.ts', 'client/services/loyaltyService.ts'],
  ['client/contexts/LoyaltyContext.fixed.tsx', 'client/contexts/LoyaltyContext.tsx'],
];

let successCount = 0;
let errorCount = 0;

// Backup function
function backupFile(filePath) {
  const backupPath = `${filePath}.backup.${Date.now()}`;
  try {
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`📦 Backed up: ${path.relative(projectRoot, filePath)} → ${path.basename(backupPath)}`);
      return backupPath;
    }
  } catch (error) {
    console.warn(`⚠️ Could not backup ${filePath}:`, error.message);
  }
  return null;
}

// Apply fixes
for (const [sourceFile, targetFile] of filesToReplace) {
  const sourcePath = path.join(projectRoot, sourceFile);
  const targetPath = path.join(projectRoot, targetFile);
  
  try {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source file not found: ${sourceFile}`);
      errorCount++;
      continue;
    }
    
    // Backup original file
    const backupPath = backupFile(targetPath);
    
    // Copy fixed file to original location
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Applied fix: ${sourceFile} → ${targetFile}`);
    
    // Remove the .fixed file
    fs.unlinkSync(sourcePath);
    console.log(`🗑️ Cleaned up: ${sourceFile}`);
    
    successCount++;
    
  } catch (error) {
    console.error(`❌ Failed to apply fix for ${targetFile}:`, error.message);
    errorCount++;
  }
}

// Summary
console.log('\n📊 Fix Application Summary:');
console.log(`✅ Successfully applied: ${successCount} fixes`);
console.log(`❌ Failed: ${errorCount} fixes`);

if (successCount > 0) {
  console.log('\n🎉 Fetch error fixes have been applied!');
  console.log('\n📋 Changes made:');
  console.log('  • Fixed API base URL detection for builder.codes environment');
  console.log('  • Enhanced error handling for network failures');
  console.log('  • Added fallback data for loyalty service');
  console.log('  • Improved error boundaries in LoyaltyContext');
  console.log('  • Graceful degradation when API is unavailable');
  
  console.log('\n🚀 Next steps:');
  console.log('  1. Test the application to verify fixes');
  console.log('  2. Check browser console for any remaining errors');
  console.log('  3. Verify loyalty features work in offline mode');
  
  console.log('\n🔄 To rollback if needed:');
  console.log('  • Use the .backup files created in each directory');
} else {
  console.log('\n❌ No fixes were applied. Please check the error messages above.');
}

// Additional recommendations
console.log('\n💡 Additional Recommendations:');
console.log('  • Set VITE_API_BASE_URL environment variable if backend is on different domain');
console.log('  • Ensure CORS is properly configured on your backend');
console.log('  • Consider implementing service worker for better offline support');
console.log('  • Monitor network requests in browser DevTools to verify fixes');

process.exit(errorCount > 0 ? 1 : 0);
