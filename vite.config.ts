import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import rawPlugin from 'vite-raw-plugin'
import svgLoader from 'vite-svg-loader';
import InlineSvg from 'vue-inline-svg';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    svgLoader({
      defaultImport: 'component',
    }),
    rawPlugin({
      fileRegex: /\.txt$/
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
