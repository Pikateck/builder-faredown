import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/spa",
    sourcemap: false, // Disable source maps in production
    emptyOutDir: true,
    minify: "terser", // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log statements
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ["console.log", "console.info", "console.debug"], // Remove specific console methods
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-toast"],
          forms: ["react-hook-form", "@hookform/resolvers"],
          icons: ["lucide-react"],
          charts: ["recharts"],
          utils: ["clsx", "tailwind-merge", "class-variance-authority"],
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000, // Warn about chunks larger than 1MB
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client"),
      "@shared": path.resolve(process.cwd(), "shared"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-toast",
    ],
    exclude: ["@react-three/fiber", "@react-three/drei", "three"], // Exclude unused deps
  },
  define: {
    // Replace process.env.NODE_ENV with actual values
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    // Enable dead code elimination for offline fallback in production
    "process.env.ENABLE_OFFLINE_FALLBACK": JSON.stringify(process.env.ENABLE_OFFLINE_FALLBACK || "false"),
    "import.meta.env.VITE_ENABLE_OFFLINE_FALLBACK": JSON.stringify(process.env.VITE_ENABLE_OFFLINE_FALLBACK || "false"),
  },
});
