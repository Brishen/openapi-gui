import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Two roles:
//  - `vite` (dev): serves index.html -> the demo playground (src/demo).
//  - `vite build`: builds the publishable library (two ESM entry points). The
//    prebuilt CSS is produced separately by `npm run build:css`
//    (@tailwindcss/cli), so the library JS build never touches Tailwind.
export default defineConfig({
  plugins: [
    react(),
    // Processes `@import "tailwindcss"` for the dev server / demo.
    tailwindcss(),
    // Emits .d.ts for the two entries; only runs during build.
    dts({
      include: ['src/core', 'src/react'],
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: 'src/core/index.ts',
        react: 'src/react/index.tsx',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    // Don't copy the demo's public/ assets into the published library.
    copyPublicDir: false,
  },
});
