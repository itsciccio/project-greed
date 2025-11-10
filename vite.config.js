import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get repository name from environment or default to project-greed
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'project-greed'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? `/${repoName}/` : '/',
})

