import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const scenarios = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/scenarios' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    description: z.string(),
    descriptionEn: z.string().optional(),
    pubDate: z.coerce.date(),
    caseId: z.string(),
    caseNumber: z.number(),
    difficulty: z.string(),
    caseType: z.string(),
    severity: z.string(),
    tags: z.array(z.string()).optional(),
    tagsEn: z.array(z.string()).optional(),
    author: z.string().optional(),
    duration_minutes: z.number().optional(),
    discoveryDate: z.string().optional(),
  }),
});

export const collections = { scenarios };
