import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
