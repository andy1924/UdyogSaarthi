import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // onnxruntime-web ships top-level await, which the default target cannot parse.
  build: { target: 'esnext' },
  esbuild: { target: 'esnext' },

  server: {
    // Cross-origin isolation lets onnxruntime-web run its threaded WASM build:
    // on a 4 s clip that is ~12 s of Whisper per turn without it, versus ~3 s
    // with it. `credentialless` keeps cross-origin model/CDN fetches working.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react', '@huggingface/transformers', 'kokoro-js', 'onnxruntime-web'],
  },
});
