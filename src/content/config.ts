import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
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
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    thumbnail: z.string().optional(),
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
          thumbnail: z.string().optional(),
          thumbnailAlt: z.string().optional(),
          url: z.string().optional(),
        })
      )
      .default([]),
    seoDescription: z.string().optional(),
  }),
});

const pages = defineCollection({
  type: 'data',
  schema: z.object({
    hero: z
      .object({
        eyebrow: z.string().optional(),
        title: z.string(),
        titleAccent: z.string().optional(),
        subtitle: z.string().optional(),
        intro: z.array(z.string()).default([]),
        postit: z.string().optional(),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
        location: z.string().optional(),
      })
      .optional(),
    services: z
      .array(
        z.object({
          icon: z.string(),
          title: z.string(),
          description: z.string(),
          items: z.array(z.string()).default([]),
        })
      )
      .default([]),
    principles: z
      .array(
        z.object({
          icon: z.string(),
          title: z.string(),
          description: z.string(),
        })
      )
      .default([]),
    timeline: z
      .array(
        z.object({
          year: z.string(),
          title: z.string(),
          description: z.string(),
        })
      )
      .default([]),
    availability: z
      .array(
        z.object({
          period: z.string(),
          status: z.string(),
          tone: z.enum(['busy', 'partial', 'open']).default('open'),
        })
      )
      .default([]),
    postit: z.string().optional(),
    cta: z
      .object({
        title: z.string(),
        text: z.string().optional(),
        buttonText: z.string().optional(),
      })
      .optional(),
    contact: z
      .object({
        email: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),
  }),
});

const settings = defineCollection({
  type: 'data',
  schema: z.object({
    siteName: z.string().default('Feiste Dialoge'),
    tagline: z.string().optional(),
    description: z.string().optional(),
    footerTagline: z.string().optional(),
    footerSubline: z.string().optional(),
    copyright: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
  }),
});

export const collections = { projects, pages, settings };
