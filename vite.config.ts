import { copyFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/devistic-ocr-image-to-text/',
  plugins: [
    react(),
    {
      name: 'copy-404',
      apply: 'build',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html');
      },
    },
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
