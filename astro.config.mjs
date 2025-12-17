// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import deno from '@astrojs/deno';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['qs']
    }
  },

  adapter: deno()
});