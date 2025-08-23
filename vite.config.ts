import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
  },
  preview: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
  },
  build: {
    outDir: "dist/spa",
    sourcemap: false,
  },
<<<<<<< HEAD
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    __DEV__: false,
  },
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    ...(mode === "development" ? [expressPlugin()] : []),
  ],
=======
  plugins: [react()],
>>>>>>> refs/remotes/origin/main
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
