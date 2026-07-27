/**
 * Catálogo de temas, tipografías e idiomas.
 *
 * Los textos de la interfaz NO viven acá: están en `src/i18n/strings.js`, que es
 * la única fuente. Tener un segundo diccionario en este archivo garantizaba que
 * los dos se desincronizaran.
 *
 * Consumido por:
 *  - src/components/ConfigDock.jsx  (los controles)
 *  - src/layouts/BaseLayout.astro   (script anti-FOUC)
 *  - src/styles/themes.css          (definición de cada paleta)
 *
 * Para agregar un tema, ver THEMES.md.
 */

/**
 * `preview` son los 3 colores del círculo de muestra del selector
 * (fondo, acento, severidad crítica). Van acá porque el chip se dibuja
 * dentro del tema activo y no puede leer los tokens de otro tema.
 */
export const THEMES = [
  { value: 'light', label: 'Light', preview: ['#ffffff', '#7c3aed', '#dc2626'] },
  { value: 'dark', label: 'Dark', preview: ['#0f172a', '#a78bfa', '#f87171'] },
  { value: 'nord', label: 'Nord', preview: ['#2e3440', '#88c0d0', '#bf616a'] },
  { value: 'dracula', label: 'Dracula', preview: ['#282a36', '#bd93f9', '#ff5555'] },
  { value: 'solarized', label: 'Solarized', preview: ['#fdf6e3', '#b58900', '#dc322f'] },
  {
    value: 'high-contrast',
    label: 'Alto contraste',
    labelEn: 'High Contrast',
    preview: ['#000000', '#ffff00', '#ff6b6b'],
  },
  { value: 'lavender', label: 'Lavender', preview: ['#faf7ff', '#8b5cf6', '#d6336c'] },
  { value: 'rose', label: 'Rose', preview: ['#fffaf7', '#e11d48', '#be123c'] },
  { value: 'cyberpunk', label: 'Cyberpunk', preview: ['#05010d', '#39ff14', '#ff2bd6'] },
  { value: 'minimal', label: 'Minimal', preview: ['#ffffff', '#171717', '#b91c1c'] },
  { value: 'forest', label: 'Forest', preview: ['#f7f4ec', '#2f6b3a', '#a03323'] },
  { value: 'sunset', label: 'Sunset', preview: ['#1a1533', '#ff7a59', '#ff5c74'] },
  { value: 'ocean', label: 'Ocean', preview: ['#06263d', '#2ec4b6', '#ff6b8a'] },
  { value: 'monochrome', label: 'Monochrome', preview: ['#ffffff', '#333333', '#1a1a1a'] },
];

export const FONTS = [
  { value: 'inter', label: 'Inter', hint: 'sans' },
  { value: 'roboto', label: 'Roboto', hint: 'sans' },
  { value: 'fira-code', label: 'Fira Code', hint: 'mono' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono', hint: 'mono' },
  { value: 'merriweather', label: 'Merriweather', hint: 'serif' },
];

export const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

export const STORAGE_KEYS = {
  theme: 'soc-theme',
  font: 'soc-font',
  lang: 'soc-lang',
};

export const DEFAULTS = {
  theme: 'light',
  font: 'inter',
  lang: 'es',
};
