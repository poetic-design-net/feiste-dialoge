import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      year: z.string(),
      genre: z.string(),
      role: z.string(),
      studio: z.string().optional(),
      language: z.string().optional(),
      syncType: z.string().optional(),
      services: z.array(z.string()).default([]),
      status: z.enum(['veröffentlicht', 'in-produktion', 'abgeschlossen']).default('abgeschlossen'),
      featured: z.boolean().default(false),
      highlight: z.boolean().default(false),
      order: z.number().default(0),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      thumbnail: image().optional(),
      thumbnailAlt: z.string().optional(),
      description: z.string(),
      scriptSnippet: z
        .object({
          header: z.string().optional(),
          page: z.string().optional(),
          dialogues: z.array(
            z.object({
              character: z.string(),
              direction: z.string().optional(),
              line: z.string(),
            })
          ),
          actionNote: z.string().optional(),
        })
        .optional(),
      postit: z
        .object({
          text: z.string(),
          author: z.string().optional(),
        })
        .optional(),
      videos: z
        .array(
          z.object({
            title: z.string(),
            subtitle: z.string().optional(),
            thumbnail: image().optional(),
            thumbnailAlt: z.string().optional(),
            url: z.string().optional(),
          })
        )
        .default([]),
      seoDescription: z.string().optional(),
    }),
});

export const collections = { projects };
