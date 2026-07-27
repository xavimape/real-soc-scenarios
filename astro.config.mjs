// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';

const google = fontProviders.google();

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), preact()],

  // Fuentes auto-hospedadas y optimizadas por Astro (sin requests a Google en runtime).
  fonts: [
    {
      provider: google,
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 600, 700],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: google,
      name: 'Roboto',
      cssVariable: '--font-roboto',
      weights: [400, 700],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: google,
      name: 'Fira Code',
      cssVariable: '--font-fira-code',
      weights: [400, 700],
      fallbacks: ['ui-monospace', 'monospace'],
    },
    {
      provider: google,
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400, 700],
      fallbacks: ['ui-monospace', 'monospace'],
    },
    {
      provider: google,
      name: 'Merriweather',
      cssVariable: '--font-merriweather',
      weights: [400, 700],
      fallbacks: ['Georgia', 'serif'],
    },
  ],

  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
