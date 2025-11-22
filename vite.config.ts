import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Use environment variable or fallback to the provided API key for GitHub Pages
    const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'AIzaSyBvZjrk4EqDuox-tvOSBBym1k0JsdB3sKg';
    return {
      base: '/palestra/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
