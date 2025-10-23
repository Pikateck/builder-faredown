const fs = require("fs");
const path = require("path");

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== "node_modules") {
        walkDir(fullPath);
      }
    } else if (file.endsWith(".js") && !file.endsWith(".cjs")) {
      fixFile(fullPath);
    }
  });
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let originalContent = content;
    
    // Convert: import express from "express"; => const express = require("express");
    content = content.replace(/import\s+(\w+)\s+from\s+["']([^"']+)["'];?/g, 'const $1 = require("$2");');
    
    // Convert: import { X, Y } from "path"; => const { X, Y } = require("path");
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/g, 'const {$1} = require("$2");');
    
    // Remove remaining import/export statements that are side effects
    content = content.replace(/^import\s+["']([^"']+)["'];?$/gm, 'require("$1");');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${filePath} - ${error.message}`);
  }
}

walkDir("./api");
console.log("\n✅ Import fixes complete!");
