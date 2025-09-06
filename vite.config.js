import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/spa',
    sourcemap: false,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/client',
      '@shared': '/shared',
    },
  },
});
