import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Get API key from environment variable
  const geminiApiKey = env.VITE_GEMINI_API_KEY || '';

  if (!geminiApiKey) {
    console.warn('⚠️  VITE_GEMINI_API_KEY not found in .env file');
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
