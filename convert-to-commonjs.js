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
    } else if (file.endsWith(".js")) {
      convertFile(fullPath);
    }
  });
}

function convertFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let originalContent = content;
    
    // Replace export default router; with module.exports = router;
    content = content.replace(/^export default router;$/gm, "module.exports = router;");
    
    // Replace export default { with module.exports = {
    content = content.replace(/^export default \{$/gm, "module.exports = {");
    
    // Replace export default function with module.exports = function
    content = content.replace(/^export default function/gm, "module.exports = function");
    
    // Replace export default class with module.exports = class
    content = content.replace(/^export default class/gm, "module.exports = class");
    
    // Replace export default [ClassName/ObjectName] with module.exports = [ClassName/ObjectName]
    content = content.replace(/^export default ([A-Za-z_$][A-Za-z0-9_$]*);$/gm, "module.exports = $1;");
    
    // Replace export function with regular function
    content = content.replace(/^export (function|const|let|var)/gm, "$1");
    
    // Replace export { with nothing (these typically need to be handled differently)
    content = content.replace(/^export \{/gm, "");
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Converted: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Start conversion from api directory
walkDir("./api");
console.log("\n✅ Conversion complete!");
