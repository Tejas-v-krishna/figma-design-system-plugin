import { defineConfig } from 'vite';
import { copyFileSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { resolve } from 'path';

// Plugin code build: bundles src/plugin/main.ts into a single self-contained
// IIFE (dist/code.js) with no external imports, because Figma runs the plugin
// `main` as a classic script and rejects ES module syntax. The UI is built by
// vite.ui.config.ts first; this build embeds that built UI (JS + CSS) directly
// into the code as `__html__` so figma.showUI(__html__) renders a fully
// self-contained UI — Figma's inline iframe has an opaque base URL, so the UI
// must not reference any external files.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // preserve the UI output from the prior build
    rollupOptions: {
      input: { code: resolve(__dirname, 'src/plugin/main.ts') },
      output: {
        entryFileNames: 'code.js',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    sourcemap: true,
  },
  plugins: [
    {
      name: 'inline-manifest',
      writeBundle() {
        const codePath = resolve(__dirname, 'dist/code.js');
        const uiJsPath = resolve(__dirname, 'dist/ui.js');

        // Embed the built UI inline into the plugin code as __html__. The UI
        // bundle is a self-contained IIFE whose CSS is injected at runtime, so
        // no external files are referenced. Escape any closing </script> so it
        // can't terminate the surrounding <script> early.
        if (existsSync(codePath) && existsSync(uiJsPath)) {
          const uiJs = readFileSync(uiJsPath, 'utf8').replace(/<\/script>/gi, '<\\/script>');
          const html = [
            '<!doctype html>',
            '<html lang="en">',
            '  <head>',
            '    <meta charset="utf-8" />',
            '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
            '    <title>Design System Kit</title>',
            '  </head>',
            '  <body>',
            '    <div id="root"></div>',
            `    <script>${uiJs}<\/script>`,
            '  </body>',
            '</html>',
          ].join('\n');
          const code = readFileSync(codePath, 'utf8');
          writeFileSync(codePath, code.replace('__html__', () => JSON.stringify(html)));
          // The UI is now inlined; the separate files are no longer needed.
          for (const f of ['ui.js', 'ui.css', 'ui.js.map', 'ui.css.map']) {
            rmSync(resolve(__dirname, 'dist', f), { force: true });
          }
          rmSync(resolve(__dirname, 'dist/src'), { recursive: true, force: true });
        }

        // Copy the root manifest into dist and rewrite paths to be relative to
        // the plugin bundle. UI is inlined, so the `ui` field is dropped.
        const manifestSrc = resolve(__dirname, 'manifest.json');
        const manifestDest = resolve(__dirname, 'dist/manifest.json');
        if (existsSync(manifestSrc)) {
          copyFileSync(manifestSrc, manifestDest);
          try {
            const m = JSON.parse(readFileSync(manifestDest, 'utf8'));
            m.main = 'code.js';
            delete m.ui;
            writeFileSync(manifestDest, JSON.stringify(m, null, 2));
          } catch {
            /* leave as-is */
          }
        }
      },
    },
  ],
});
