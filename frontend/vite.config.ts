import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { boneyardPlugin } from 'boneyard-js/vite';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    plugins: [
      react(),
      tailwindcss(),
      boneyardPlugin({
        framework: 'react',
        out: './bones',
        routes: ['/login.html', '/register.html'],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
        }
      }
    }
  };
});
