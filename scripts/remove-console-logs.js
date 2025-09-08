#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');
const clientDir = path.join(projectRoot, 'client');

// File extensions to process
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Console methods to remove
const consoleMethods = [
  'console.log',
  'console.info', 
  'console.debug',
  'console.warn',
  'console.error',
  'console.trace',
  'console.time',
  'console.timeEnd',
  'console.group',
  'console.groupEnd'
];

// Patterns to preserve (important error handling)
const preservePatterns = [
  /console\.error\s*\(\s*["'].*error.*["']/i,
  /console\.error\s*\(\s*["'].*failed.*["']/i,
  /catch.*console\.error/i,
  /\.catch.*console\.error/i
];

function shouldPreserveLine(line) {
  return preservePatterns.some(pattern => pattern.test(line));
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    
    const processedLines = lines.map(line => {
      // Skip if this is an important error log we want to keep
      if (shouldPreserveLine(line)) {
        return line;
      }
      
      // Check if line contains console statements
      const hasConsole = consoleMethods.some(method => line.includes(method));
      
      if (hasConsole) {
        // Check if it's a standalone console statement
        const trimmed = line.trim();
        if (trimmed.startsWith('console.') && trimmed.endsWith(';')) {
          modified = true;
          return ''; // Remove the entire line
        }
        
        // For inline console statements, comment them out
        if (trimmed.includes('console.')) {
          modified = true;
          const indent = line.match(/^\s*/)[0];
          return `${indent}// ${trimmed} // Removed for production`;
        }
      }
      
      return line;
    });
    
    if (modified) {
      // Remove empty lines that were console statements
      const cleanedLines = processedLines.filter((line, index) => {
        if (line === '') {
          // Keep empty line if it's not where a console statement was
          const prevLine = index > 0 ? lines[index - 1] : '';
          const nextLine = index < lines.length - 1 ? lines[index + 1] : '';
          
          // Remove if surrounded by code (likely was a console statement)
          if (prevLine.trim() && nextLine.trim()) {
            return false;
          }
        }
        return true;
      });
      
      const newContent = cleanedLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Processed: ${path.relative(projectRoot, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  let processedCount = 0;
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git
        if (item !== 'node_modules' && item !== '.git') {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          if (processFile(fullPath)) {
            processedCount++;
          }
        }
      }
    }
  }
  
  walk(dir);
  return processedCount;
}

console.log('🧹 Removing console.log statements from client code...');
console.log(`📂 Processing directory: ${clientDir}`);

const processedCount = walkDirectory(clientDir);

console.log(`\n✨ Performance optimization complete!`);
console.log(`📊 Files processed: ${processedCount}`);
console.log(`🚀 Console statements removed for production builds`);
