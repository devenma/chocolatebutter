// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import deno from '@astrojs/deno';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: deno()
});