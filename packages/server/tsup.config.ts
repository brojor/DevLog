import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  outDir: 'dist',
  sourcemap: true,
  minify: false,
  splitting: false,
})
