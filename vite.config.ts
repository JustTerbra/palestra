import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // For local development: use .env file
  // For GitHub Pages deployment: use fallback hardcoded key
  const geminiApiKey = env.VITE_GEMINI_API_KEY || 'AIzaSyBikL3Kp_JfBjfGD1m5MnkDW_8wr1PqFbw';

  if (!env.VITE_GEMINI_API_KEY) {
    console.warn('⚠️  Using fallback API key for GitHub Pages deployment');
  } else {
    console.log('✅ Using API key from .env file (local development)');
  }

  return {
    base: '/palestra/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
