import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_BASE_URL || 'http://localhost:3000';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
        '/health': {
          target,
          changeOrigin: true,
        },
        '/ai-api': {
          target: env.VITE_AI_PROXY_TARGET || 'https://api.ai.camer.digital/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai-api/, ''),
        },
      },
    },
  };
});
