import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// BUG FIX: Removed `loadEnv` and `define: { 'process.env.GEMINI_API_KEY': ... }`.
// Exposing server-side API keys via Vite's `define` embeds them in the client JS bundle,
// making them readable by anyone who views your deployed site source.
// If you need GEMINI in the browser, use VITE_GEMINI_API_KEY (prefix VITE_) which is
// intentionally public, and access via import.meta.env.VITE_GEMINI_API_KEY.

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
