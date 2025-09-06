#!/usr/bin/env node

import { build } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildApp() {
  try {
    console.log("🔨 Building Faredown app...");

    await build({
      root: __dirname,
      plugins: [react()],
      build: {
        outDir: "dist/spa",
        sourcemap: false,
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          "@": resolve(__dirname, "./client"),
          "@shared": resolve(__dirname, "./shared"),
        },
      },
    });

    console.log("✅ Build completed successfully!");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

buildApp();
