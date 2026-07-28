# Real SOC Scenarios

Casos reales de investigación en un SOC, documentados paso a paso: qué disparó la
alerta, qué miró el analista, en qué orden, y por qué llegó a esa conclusión.

Cada caso combina la narrativa con componentes interactivos — línea de tiempo del
incidente, tabla de IOCs, mapeo a MITRE ATT&CK y la ficha de cierre — para que se
pueda seguir el razonamiento y no solo el resultado.

El sitio es bilingüe. Cada idioma tiene su propia ruta y su propio archivo de
contenido.

## Fuentes

Los casos se arman a partir de material público: avisos de CISA, reportes de
Mandiant y Elastic Security Labs, publicaciones de vendors y writeups de la
comunidad. Cada escenario indica su fuente en el frontmatter (`author`) y enlaza
las técnicas al catálogo de MITRE ATT&CK.

Los indicadores se publican defangueados (`hxxps://`) y no se incluye
infraestructura de ningún entorno real. Los escenarios sintéticos usan los rangos
y dominios que las RFC reservan para documentación, así que nada de lo que aparece
puede resolverse.

Cuando dos fuentes buenas discrepan sobre un dato, el caso anota la discrepancia
en lugar de elegir en silencio.

## Stack

- Astro 7 con MDX para el contenido y Preact para los componentes interactivos
- Colecciones de contenido tipadas con Zod (`src/content.config.ts`)
- Sistema de temas y tipografías por custom properties — ver [THEMES.md](THEMES.md)
- Sitio estático, sin backend

## Estructura

```text
src/
├── components/
│   ├── soc/               Componentes de caso (timeline, IOCs, ATT&CK, reporte, marcos)
│   ├── mdx/               Marcas en línea que se inyectan al contenido
│   ├── SiteHeader.jsx     Encabezado: configuración, marca y volver
│   ├── CaseDeck.jsx       Mazo de casos destacados del inicio
│   ├── Globe.jsx          Globo con la geografía de los casos
│   └── TableOfContents.jsx  Índice lateral con seguimiento del scroll
├── config/                Catálogo de temas, fuentes e idiomas
├── content/scenarios/
│   ├── es/                Un .mdx por caso
│   └── en/                Su equivalente en inglés
├── data/                  Máscara de tierra firme del globo (generada)
├── i18n/                  Diccionario de interfaz y helpers de ruta
├── layouts/               Layout base
├── pages/                 Raíz de reparto y rutas /[lang]/
├── styles/                Temas y estilos de cada pieza
└── utils/                 Construcción de URL con base

scripts/                   Verificaciones que corren sobre dist/
tools/                     Auditorías y generadores que corren sobre el código
```

## Comandos

| Comando              | Acción                                                     |
| -------------------- | ---------------------------------------------------------- |
| `npm install`        | Instala dependencias                                       |
| `npm run dev`        | Servidor de desarrollo en `localhost:4321`                  |
| `npm run build`      | Genera el sitio en `./dist/`                               |
| `npm run preview`    | Sirve el build local antes de desplegar                    |
| `npm run check`      | Defangueo, idioma y contraste del globo, sobre `./dist/`    |
| `npm run audit:i18n` | Cobertura de traducción de la interfaz, sobre el código     |

Dos auditorías más, que se corren a mano:

| Comando                                    | Acción                                              |
| ------------------------------------------ | --------------------------------------------------- |
| `node tools/auditar-idioma-casos.mjs`      | Busca secciones escritas en el idioma equivocado     |
| `node tools/generar-mascara-tierra.mjs`    | Regenera el mapa del globo (solo al cambiar detalle) |

`npm run check` verifica lo que se publica; `audit:i18n` verifica lo que se
escribió. Ninguna de las dos alcanza sola.

## Agregar un caso

1. El archivo va en `src/content/scenarios/es/NN-nombre-del-caso.mdx`. El
   directorio define el idioma y el nombre define la URL.
2. El frontmatter sigue el esquema de `src/content.config.ts` (`caseId`,
   `caseNumber`, `severity`, `difficulty`, `pubDate`). El campo `locations` es
   opcional y coloca marcadores en el globo del inicio.
3. Los componentes se importan desde `@/components/soc/`.
4. La ruta se genera sola en `/es/scenarios/<nombre-del-archivo>/`.

Los componentes se renderizan estáticos por defecto. Para habilitar filtros,
botones y demás interacción llevan `client:load`.

**Cada componente interactivo recibe `lang` con el idioma de su archivo.** Sin ese
atributo, la interfaz de ese componente sale en el idioma por defecto dentro de una
página del otro.

La versión en inglés se escribe al final, cuando el caso en español está
investigado, cargado y revisado en el navegador. Traducir sobre contenido que
todavía puede cambiar obliga a corregir dos veces.

## Marcos de análisis

Además de los componentes del informe, hay tres marcos que se abren en ventana
aparte desde un botón. Son material de apoyo opcional: no todos los casos llevan
uno, y varios no llevan ninguno.

El criterio: **si no hay datos reales para llenarlo, no va.** Un marco a medio
completar enseña menos que su ausencia.

| Marco            | Se incluye cuando…                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `PyramidOfPain`  | El caso tiene indicadores en varios escalones, o la lección es *por qué* falló la detección por firma |
| `DiamondModel`   | Hay datos en los cuatro vértices: adversario identificado, capacidad, infraestructura y víctima       |
| `KillChain`      | Se puede señalar en qué eslabón se cortó la cadena, o por qué no se cortó en ninguno                  |

Los tres requieren `client:load`: sin hidratar, el botón no abre nada.

## Convenciones de contenido

Las marcas en línea `<Pass />`, `<Fail />` y `<Warn />` están disponibles en
cualquier `.mdx` sin importarlas. Se usan cuando el contraste forma parte del
argumento — tres hipótesis donde dos no cierran, lo que un control detecta frente
a lo que no. Una lista donde todos los renglones llevan la misma marca no está
usando la marca para nada.

La iconografía sale de `src/components/Icon.jsx`.

Lo que un analista copiaría a una consola o a un buscador queda igual en los dos
idiomas: comandos, direcciones IP, hashes, identificadores de MITRE, nombres de
familia de malware, reglas de detección y códigos de protocolo.

## Despliegue

El mismo commit sirve para dos destinos, y la diferencia son dos variables de
entorno que `astro.config.mjs` lee con valores por defecto para desarrollo local.

- **Cloudflare**: sirve desde la raíz del dominio, así que no lleva `BASE_PATH`.
  La configuración de publicación está en `wrangler.jsonc`.
- **GitHub Pages**: sirve desde un subdirectorio, y el workflow de
  `.github/workflows/` inyecta `BASE_PATH` con el nombre del repositorio.

Ningún enlace interno se escribe a mano: todos pasan por `withBase()`, que es lo
que hace que las dos formas funcionen sin tocar el contenido.
