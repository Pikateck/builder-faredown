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
    
    // First, convert imports to requires
    // import X from "path" => const X = require("path")
    content = content.replace(/^import\s+(\w+)\s+from\s+["']([^"']+)["'];?$/gm, 'const $1 = require("$2");');
    
    // import { X, Y } from "path" => const { X, Y } = require("path")
    content = content.replace(/^import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?$/gm, 'const {$1} = require("$2");');
    
    // import * as X from "path" => const X = require("path")
    content = content.replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["'];?$/gm, 'const $1 = require("$2");');
    
    // import "path" (side effects only) => require("path")
    content = content.replace(/^import\s+["']([^"']+)["'];?$/gm, 'require("$1");');
    
    // Now convert exports
    // export default router; => module.exports = router;
    content = content.replace(/^export\s+default\s+(\w+);$/gm, "module.exports = $1;");
    
    // export default { ... }
    content = content.replace(/^export\s+default\s+\{$/gm, "module.exports = {");
    
    // export default function => module.exports = function
    content = content.replace(/^export\s+default\s+(function|class)/gm, "module.exports = $1");
    
    // export { X, Y, Z }; => module.exports = { X, Y, Z };
    content = content.replace(/^export\s+\{\s*([^}]+)\s*\};?$/gm, (match, exports) => {
      const items = exports.split(",").map(item => {
        const trimmed = item.trim();
        return trimmed.split(" as ")[0].trim();
      }).join(", ");
      return `module.exports = { ${items} };`;
    });
    
    // export const X = ... => just remove export
    content = content.replace(/^export\s+(const|let|var|function|class)\s+/gm, "$1 ");
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Converted: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

walkDir("./api");
console.log("\n✅ Full conversion complete!");
