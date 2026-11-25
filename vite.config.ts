import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'charts';
          if (id.includes('node_modules/katex')) return 'math';
          if (id.includes('@huggingface/transformers') || id.includes('onnxruntime')) {
            return 'transformers';
          }
          return undefined;
        },
      },
    },
  },
})
