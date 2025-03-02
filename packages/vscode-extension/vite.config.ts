import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node20',
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/extension.ts'),
      formats: ['cjs'],
      fileName: 'extension',
    },
    rollupOptions: {
      external: [
        'vscode',
        /node:.*/,
      ],
    },
    sourcemap: true,
    minify: false,
  },
})
