import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-512x512.png', 'favicon.ico', 'robots.txt'],
        manifest: {
          name: 'Bar Manager Pro',
          short_name: 'GastroPro',
          description: 'Sistema Profissional de Gestão para Bares e Restaurantes',
          theme_color: '#121214',
          background_color: '#121214',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      hmr: {
        protocol: 'wss',
        clientPort: 443 // Vercel/Production uses 443 for wss
      }
    },
  };
});
