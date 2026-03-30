import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
      'global': 'globalThis',
      'FormData': 'globalThis.FormData',
    },
    resolve: {
      alias: [
        { find: /^formdata-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-polyfill.ts') },
        { find: 'formdata-polyfill/esm.min.js', replacement: path.resolve(__dirname, 'src/lib/fetch-polyfill.ts') },
        { find: /^node-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/fetch-polyfill.ts') },
        { find: /^whatwg-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/empty.ts') },
        { find: /^isomorphic-fetch(\/.*)?$/, replacement: path.resolve(__dirname, 'src/lib/empty.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    optimizeDeps: {
      exclude: ['formdata-polyfill', 'node-fetch', 'whatwg-fetch', 'isomorphic-fetch', 'gaxios', 'google-auth-library', 'fetch-blob', 'web-streams-polyfill'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
