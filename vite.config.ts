import { cloudflare } from '@cloudflare/vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [cloudflare()],
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            main: resolve(import.meta.dirname, 'index.html'),
            admin: resolve(import.meta.dirname, 'admin/index.html')
          }
        }
      }
    }
  }
});
