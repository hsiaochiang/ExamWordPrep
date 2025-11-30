import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ExamWordPrep/',
  plugins: [react()],
  server: {
    port: 5173
  }
});
