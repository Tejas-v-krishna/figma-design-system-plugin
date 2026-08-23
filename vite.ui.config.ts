import { defineConfig } from 'vite';
import { resolve } from 'path';

// UI build: bundles the React UI entry (src/ui/index.tsx) into a single
// self-contained IIFE (dist/ui.js) plus its extracted CSS (dist/ui.css).
// We build it as an IIFE (not a module) so it can later be embedded inline
// inside the plugin code's `__html__`. Figma renders inline `__html__` in an
// iframe with an opaque base URL, so the UI must not reference any external
// files — everything is inlined by vite.config.ts.
//
// `build.target` is deliberately left at vite's default, and should stay that
// way. Pinning it — say to 'es2020', to match tsconfig — looks like a tidy way
// to stop the emitted syntax level drifting with the toolchain, and it costs
// more than it buys: `build.cssTarget` inherits `build.target`, and a bare
// ES-year target tells esbuild nothing about browsers, so it stops emitting
// `-webkit-backdrop-filter`. This UI leans on backdrop-filter in four places
// and Figma runs in Safari, where the unprefixed property is not enough.
//
// Nothing is at risk on the JS side either way: the only syntax the two
// settings disagree about here is native class fields versus a defineProperty
// helper, and the iframe is Chromium or Safari 16+, both of which take either.
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
