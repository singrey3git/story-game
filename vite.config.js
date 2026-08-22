import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built app works from any GitHub Pages project path
// (https://username.github.io/story-game/) without extra configuration.
export default defineConfig({
  plugins: [react()],
  base: './',
})
