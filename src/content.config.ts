import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    caseId: z.string(),
    caseNumber: z.number(),
    difficulty: z.string(),
    caseType: z.string(),
    severity: z.string(),
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
    author: z.string().optional(),
    duration_minutes: z.number().optional(),
    discoveryDate: z.string().optional(),
  }),
});

export const collections = { scenarios };
