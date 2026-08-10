import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Valores cerrados.
 *
 * Antes eran `z.string()`, que aceptaba cualquier cosa: un `difficulty:
 * "avanzado"` o un `severity: "Alta"` habrían pasado la validación y roto en
 * silencio el color del badge y el orden del listado, porque los dos campos sí
 * se leen para dibujar.
 *
 * `MEDIUM` no lo usa ningún caso todavía y se deja igual: la escala de
 * severidad es una escala, no un inventario de lo que ya escribimos.
 */
const DIFICULTAD = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const SEVERIDAD = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

/**
 * Familias de caso.
 *
 * La lista creció de a un valor por caso, y hoy siete de los nueve tienen un
 * solo uso. Como taxonomía sirve poco; como enumeración sirve para que agregar
 * una familia sea un acto deliberado y no un error de tipeo.
 *
 * Nada del sitio lee este campo: no colorea, no ordena y no filtra. Si alguna
 * vez tiene que manejar interfaz, conviene colapsarlo a `educativo | real` y
 * dejar el matiz en `tags`, que es donde ya vive de hecho.
 */
const FAMILIA = [
  'educational_basic',
  'educational_synthetic',
  'real_case_classic',
  'real_case_critical_recent',
  'real_case_mass_exploitation',
  'real_case_cloud_misconfiguration',
  'real_case_recovery',
  'real_case_third_party',
  // Distinto de `third_party`: ahí el proveedor sufre un incidente y te salpica.
  // Acá el producto que instalaste llega ya comprometido y firmado por su autor.
  'real_case_supply_chain',
  'real_case_ot',
] as const;

const scenarios = defineCollection({
  // Los casos viven en `scenarios/<idioma>/<archivo>.mdx`, así que el `id` que
  // devuelve el loader arranca con el idioma: `es/01-phishing-investigation`.
  // De ahí salen la URL y el idioma de la página — ver `src/i18n/rutas.js`.
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/scenarios' }),
  schema: z.object({
    // Un archivo, un idioma. Antes había `titleEn` y `descriptionEn` en el mismo
    // archivo, con el cuerpo solo en español: el título cambiaba de idioma y el
    // caso no. Ahora el idioma de los metadatos y el del texto no se pueden
    // separar, porque son el mismo archivo.
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),

    // `caseId` y `caseNumber` tienen que coincidir entre sí, con el prefijo del
    // archivo y entre los dos idiomas. Zod valida un archivo por vez y no puede
    // ver esas relaciones: las verifica `tools/verificar-catalogo.mjs`.
    caseId: z.string(),
    caseNumber: z.number(),

    difficulty: z.enum(DIFICULTAD),
    caseType: z.enum(FAMILIA),
    severity: z.enum(SEVERIDAD),

    // Etiquetas temáticas. Hoy no se renderizan en ninguna parte; son el índice
    // real de qué cubre cada caso y el insumo para decidir qué falta escribir.
    tags: z.array(z.string()).optional(),

    // Geografía real del caso, para los marcadores del globo del inicio.
    // Es opcional a propósito: un caso sintético no tiene una geografía
    // verdadera que declarar, y preferimos que no aparezca antes que inventarle
    // una. Ver la invariante 2.
    locations: z
      .array(
        z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
          label: z.string(),
        })
      )
      .optional(),

    // Obligatorio desde que los dieciséis casos lo traen y la página de caso lo
    // muestra. En los reales dice de dónde salió el material; en los sintéticos
    // dice que el escenario es construido, que es información igual de
    // importante para quien lee.
    author: z.string(),

    // Duración estimada de la investigación relatada. No se renderiza; queda
    // como dato del caso.
    duration_minutes: z.number().optional(),

    // Solo casos reales: cuándo se conoció públicamente el incidente. Tampoco se
    // renderiza todavía.
    discoveryDate: z.string().optional(),
  }),
});

export const collections = { scenarios };
