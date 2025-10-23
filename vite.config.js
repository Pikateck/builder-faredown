const path = require("path");
const react = require("@vitejs/plugin-react-swc");

module.exports = {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
};
