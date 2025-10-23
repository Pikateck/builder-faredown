import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/spa",
    sourcemap: false,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client"),
      "@shared": path.resolve(process.cwd(), "shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
});
