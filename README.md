# Real SOC Scenarios

Casos reales de investigación en un SOC, documentados paso a paso: qué disparó la
alerta, qué miró el analista, en qué orden, y por qué llegó a esa conclusión.

Cada caso combina la narrativa con componentes interactivos — línea de tiempo del
incidente, tabla de IOCs, mapeo a MITRE ATT&CK y la ficha de cierre — para que se
pueda seguir el razonamiento y no solo el resultado.

## Fuentes

Los casos se arman a partir de material público: avisos de CISA, reportes de
Mandiant y Elastic Security Labs, publicaciones de vendors y writeups de la
comunidad. Cada escenario indica su fuente en el frontmatter (`author`) y enlaza
las técnicas al catálogo de MITRE ATT&CK.

Los indicadores se publican defangueados (`hxxps://`) y no se incluye
infraestructura de ningún entorno real.

## Stack

- Astro 7 con MDX para el contenido y Preact para los componentes interactivos
- Colecciones de contenido tipadas con Zod (`src/content.config.ts`)
- Sistema de temas y tipografías por custom properties — ver [THEMES.md](THEMES.md)
- Sitio estático, sin backend

## Estructura

```text
src/
├── assets/svg/          Iconos y diagramas
├── components/
│   ├── soc/             Componentes de caso (timeline, IOCs, ATT&CK, reporte)
│   └── ConfigDock.jsx   Selector de tema, tipografía e idioma
├── config/              Catálogo de temas, fuentes e idiomas
├── content/scenarios/   Un .mdx por caso
├── layouts/             Layout base
├── pages/               Índice y ruta dinámica de casos
└── styles/              Temas y estilos del dock
```

## Comandos

| Comando           | Acción                                     |
| ----------------- | ------------------------------------------ |
| `npm install`     | Instala dependencias                       |
| `npm run dev`     | Servidor de desarrollo en `localhost:4321` |
| `npm run build`   | Genera el sitio en `./dist/`               |
| `npm run preview` | Sirve el build local antes de desplegar    |

## Agregar un caso

1. Crear `src/content/scenarios/NN-nombre-del-caso.mdx`.
2. Completar el frontmatter según el esquema de `src/content.config.ts`
   (`caseId`, `caseNumber`, `severity`, `difficulty`, `pubDate`, etc.).
3. Importar los componentes que se vayan a usar desde `@/components/soc/`.
4. La ruta se genera sola en `/scenarios/<nombre-del-archivo>/`.

Los componentes se renderizan estáticos por defecto. Para habilitar filtros,
botones y demás interacción, agregar `client:load` en el MDX.

## Marcos de análisis

Además de los componentes del informe, hay tres marcos que se abren en ventana
aparte desde un botón. Son material de apoyo opcional: **no todos los casos
llevan uno, y varios no llevan ninguno.**

La regla es una sola: **si no hay datos reales para llenarlo, no va.** Un marco a
medio completar enseña menos que su ausencia.

| Marco            | Incluirlo cuando…                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `PyramidOfPain`  | El caso tiene indicadores en varios escalones, o la lección es *por qué* falló la detección por firma |
| `DiamondModel`   | Hay datos en los cuatro vértices: adversario identificado, capacidad, infraestructura y víctima       |
| `KillChain`      | Se puede señalar en qué eslabón se cortó la cadena, o por qué no se cortó en ninguno                  |

Los tres requieren `client:load`: sin hidratar, el botón no abre nada.

Marcadores en línea para el texto: `<Pass />`, `<Fail />` y `<Warn />` están
disponibles en cualquier `.mdx` sin importarlos. Reservalos para cuando el
contraste es parte del argumento — no como viñetas decorativas.

La iconografía sale de `src/components/Icon.jsx`.
