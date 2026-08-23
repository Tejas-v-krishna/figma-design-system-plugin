import { defineConfig } from 'vite';
import { resolve } from 'path';

// UI build: bundles the React UI entry (src/ui/index.tsx) into a single
// self-contained IIFE (dist/ui.js) plus its extracted CSS (dist/ui.css).
// We build it as an IIFE (not a module) so it can later be embedded inline
// inside the plugin code's `__html__`. Figma renders inline `__html__` in an
// iframe with an opaque base URL, so the UI must not reference any external
// files — everything is inlined by vite.config.ts.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { ui: resolve(__dirname, 'src/ui/index.tsx') },
      output: {
        entryFileNames: 'ui.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    sourcemap: true,
  },
});
