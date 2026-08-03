// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';

const google = fontProviders.google();

/**
 * El mismo commit tiene que poder publicarse en Cloudflare Pages (sirve desde la
 * raíz del dominio) y en GitHub Pages como sitio de proyecto (sirve desde
 * `/<repo>/`). Ambos valores salen del entorno, con el default puesto en la raíz
 * porque es lo que necesita el desarrollo local.
 *
 *   BASE_PATH=/real-soc-scenarios   -> GitHub Pages
 *   BASE_PATH sin definir            -> Cloudflare Pages y `npm run dev`
 */
const base = process.env.BASE_PATH || '/';
const site = process.env.SITE_URL || 'http://localhost:4321';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
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

    /**
     * El escáner de dependencias del servidor de desarrollo corre esbuild con su
     * propia configuración y no lee el `jsxImportSource` de `tsconfig.json`. Sin
     * esto busca `react/jsx-dev-runtime`, no lo encuentra —el proyecto es Preact,
     * D-010— y aborta el pre-empaquetado con un error confuso que apunta a un
     * componente al azar.
     *
     * Solo afecta al desarrollo: el build usa la integración de Preact, que sí
     * aplica la transformación correcta, y por eso compilaba sin quejarse.
     *
     * **Va declarado en los dos lugares, y no es redundancia.** `esbuild`
     * gobierna la transformación de los módulos del proyecto;
     * `optimizeDeps.esbuildOptions` gobierna el escaneo previo de dependencias,
     * que es un paso aparte con su propia configuración. Hasta Vite 7 el primero
     * alcanzaba porque el segundo heredaba de él. Vite 8 dejó de heredar y el
     * error volvió con el mismo texto (E-025).
     */
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'preact',
    },

    optimizeDeps: {
      esbuildOptions: {
        jsx: 'automatic',
        jsxImportSource: 'preact',
      },
    },
  },
});
