const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react-swc");
const path = require("path");

module.exports = defineConfig({
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
