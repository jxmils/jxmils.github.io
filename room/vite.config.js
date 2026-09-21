import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  publicDir: false,
  build: {
    rollupOptions: {
      input: { room:fileURLToPath(new URL('./index.html',import.meta.url)), profile:fileURLToPath(new URL('./profile.html',import.meta.url)) },
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
