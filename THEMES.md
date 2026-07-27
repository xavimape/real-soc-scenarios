# Temas y apariencia

El sitio tiene 14 temas, 5 tipografías y dos idiomas de interfaz, todo intercambiable
desde el botón **Config** del dock inferior. Nada de esto requiere recargar la página
ni hacer un request: son atributos en `<html>` que el CSS resuelve al vuelo.

## Cómo funciona

Tres atributos en `<html>` controlan la apariencia:

| Atributo     | Valores                                          | Clave en localStorage |
| ------------ | ------------------------------------------------ | --------------------- |
| `data-theme` | `light`, `dark`, `nord`, … (14 en total)          | `soc-theme`           |
| `data-font`  | `inter`, `roboto`, `fira-code`, …                 | `soc-font`            |
| `data-lang`  | `es`, `en`                                        | `soc-lang`            |

El script inline de `src/layouts/BaseLayout.astro` los aplica **antes del primer
pintado**, leyendo `localStorage`. Sin ese paso se vería un flash blanco al recargar
en un tema oscuro. Si no hay nada guardado, respeta `prefers-color-scheme`.

Todo el resto del sitio consume tokens (`var(--bg)`, `var(--sev-critical)`, …) y no
conoce los temas: por eso agregar uno no toca ningún componente.

## Agregar un tema nuevo — 3 pasos

**1. Definir la paleta** en `src/styles/themes.css`, copiando cualquier bloque
existente como plantilla:

```css
:root[data-theme='midnight'] {
  color-scheme: dark;
  --bg: #0b1020;
  --bg-subtle: #121936;
  --bg-elevated: #161f42;
  --text: #e6ecff;
  --text-muted: #93a0c8;
  --border: #26315c;
  --accent: #6ea8fe;
  --accent-soft: #161f42;
  --accent-border: #3f5f9e;
  --accent-contrast: #0b1020;
  --sev-critical: #ff6b8a;
  --sev-high: #ffa45c;
  --sev-medium: #ffd97d;
  --sev-low: #6ea8fe;
  --sev-info: #7ee0d3;
  --actor-attacker: #ff6b8a;
  --actor-defender: #7ee0d3;
  --actor-system: #6ea8fe;
  --actor-user: #c4b5fd;
  --verdict-malicious: #ff6b8a;
  --verdict-suspicious: #ffa45c;
  --verdict-clean: #7ee0d3;
  --verdict-unknown: #93a0c8;
}
```

**2. Registrarlo** en `src/config/appearance.js`, una línea en el array `THEMES`:

```js
{ value: 'midnight', label: 'Midnight', preview: ['#0b1020', '#6ea8fe', '#ff6b8a'] },
```

**3. Listo.** El selector, las tarjetas, el timeline, las tablas de IOCs y el dock
lo toman automáticamente.

### Detalles que conviene no saltear

- **`color-scheme`** le dice al navegador cómo pintar scrollbars, inputs y el
  autofill. Ponerlo mal deja controles blancos sobre fondo negro.
- **`preview`** son los tres colores del círculo del selector (fondo, acento,
  severidad crítica). Van en JS porque el chip se dibuja dentro del tema *activo*
  y no puede leer los tokens de otro tema.
- **No hace falta definir `--sev-*-bg`**: los fondos suaves de severidad se derivan
  con `color-mix()` sobre `--bg-elevated`, así que se adaptan solos.
- **El texto sobre color** (badges de severidad) usa `var(--bg)`, no blanco fijo.
  En temas oscuros los colores de severidad son claros y el blanco encima sería
  ilegible.
- **`--radius` y `--shadow`** son opcionales; se heredan de `:root` si no los
  redefinís. Los temas `minimal` y `high-contrast` los pisan a propósito.

## Contraste y accesibilidad

Dos temas están pensados específicamente para accesibilidad:

- **High Contrast** — negro puro con amarillo, bordes sólidos, sin sombras.
- **Monochrome** — ningún dato codificado por matiz. La severidad se distingue solo
  por luminosidad (`#1a1a1a` crítico → `#b0b0b0` info), así que sigue siendo legible
  con cualquier tipo de daltonismo.

Al agregar un tema, verificar que texto sobre fondo llegue a 4.5:1 (WCAG AA) y que
`--text-muted` no baje de 4.5:1 sobre `--bg-elevated` — es el que más se cae.

## Tipografías

Se cargan con la API de fuentes de Astro (`fonts` en `astro.config.mjs`): Astro las
descarga en el build, las auto-hospeda y genera las métricas de fallback. No hay
requests a servidores externos en runtime.

`--font-body` sigue al tema tipográfico elegido. `--font-mono` es independiente: los
datos técnicos (IPs, hashes, timestamps, IDs de MITRE) se mantienen monoespaciados
aunque elijas Merriweather.

Para agregar una fuente: una entrada en el array `fonts` de `astro.config.mjs`, un
`<Font cssVariable="…" />` en `BaseLayout.astro`, la regla `:root[data-font='…']` en
`themes.css` y la línea en `FONTS` de `appearance.js`.

## Idioma

El selector cambia `data-lang` y el CSS oculta la variante que no corresponde:

```css
:root[data-lang='es'] [data-lang='en'],
:root[data-lang='en'] [data-lang='es'] {
  display: none;
}
```

Las páginas emiten ambas versiones a partir de `title`/`titleEn` y
`description`/`descriptionEn` del frontmatter. Cuando falta la traducción, cae al
español.

**Estado actual:** traducidos los títulos, descripciones y la interfaz. El cuerpo de
cada caso sigue en español — los `.mdx` tienen un solo bloque de contenido. Para
traducirlos habría que dividir el contenido por idioma o duplicar el archivo, y
conviene decidirlo cuando haya más casos cargados.
