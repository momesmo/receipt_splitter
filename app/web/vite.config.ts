import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../ec2',
    emptyOutDir: true,
  },
  test: {
    globals: false,
  },
})
