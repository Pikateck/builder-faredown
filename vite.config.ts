import { defineConfig } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

type ViteMode = "development" | "production";

export default defineConfig(({ command }) => {
  const isBuild = command === "build";
  const nodeEnv: ViteMode = isBuild ? "production" : "development";
  const enableOfflineFallback = process.env.ENABLE_OFFLINE_FALLBACK ?? "false";
  const viteOfflineFallback = process.env.VITE_ENABLE_OFFLINE_FALLBACK ?? "false";

  return {
    plugins: [react()],
    build: {
      outDir: "dist/spa",
      sourcemap: false,
      emptyOutDir: true,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
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
      chunkSizeWarningLimit: 1000,
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
      exclude: ["@react-three/fiber", "@react-three/drei", "three"],
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(nodeEnv),
      "process.env.ENABLE_OFFLINE_FALLBACK": JSON.stringify(enableOfflineFallback),
      "import.meta.env.VITE_ENABLE_OFFLINE_FALLBACK": JSON.stringify(viteOfflineFallback),
    },
  };
});
