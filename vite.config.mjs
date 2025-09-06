export default {
  plugins: [],
  build: {
    outDir: 'dist/spa',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  },
  resolve: {
    alias: {
      '@': '/client',
      '@shared': '/shared'
    }
  }
};
