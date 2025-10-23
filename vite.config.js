const path = require("path");

module.exports = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
};
