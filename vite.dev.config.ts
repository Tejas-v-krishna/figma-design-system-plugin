import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Dev-only config. Serves dev/index.html, which installs a mock plugin sandbox
// (dev/mock-plugin.ts) and then loads the real UI. This exists because the UI is
// otherwise only reachable inside Figma, where it can't be inspected, screenshot
// or reloaded quickly.
//
// Never part of `npm run build` — the shipped bundles come from vite.ui.config.ts
// and vite.config.ts, neither of which references dev/.
export default defineConfig({
  root: resolve(__dirname, 'dev'),
  plugins: [react()],
  server: {
    port: 5178,
    strictPort: true,
  },
});
