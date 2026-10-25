import { defineConfig } from 'vite'

export default defineConfig({
  // Relative paths, so the build runs from GitHub Pages' /CalisthenicsTree/ subpath.
  base: './',
  server: { port: 5192, strictPort: true },
})
