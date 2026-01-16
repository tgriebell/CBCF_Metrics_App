import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [ react(), basicSsl() ],
  build: {
    minify: false, // DESLIGA MINIFICAÇÃO TOTALMENTE (Teste de Debug)
    terserOptions: {
      compress: false,
      mangle: false,
    },
    rollupOptions: {
      // Garante que o Recharts não seja quebrado
      output: {
        manualChunks: undefined,
        format: 'es', // Garante formato de módulo padrão
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
})