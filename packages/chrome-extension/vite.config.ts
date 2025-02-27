import process from 'node:process'
import { defineConfig } from 'vite'
import webExtension from 'vite-plugin-web-extension'

export default defineConfig({
  plugins: [
    webExtension(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
  },
})
