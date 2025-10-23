#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

// Try to run vite directly
const vitePath = path.join(__dirname, "node_modules", ".bin", "vite");
const viteModule = path.join(
  __dirname,
  "node_modules",
  "vite",
  "bin",
  "vite.js",
);

try {
  const cmd = `node "${viteModule}" build --outDir dist`;
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}
