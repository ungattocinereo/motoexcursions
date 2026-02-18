import { defineCollection, z } from 'astro:content';

const tours = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    coverImage: z.string(),
    gallery: z.array(z.string()),
    excerpt: z.string(),
    highlights: z.array(z.string()),
    duration: z.string(),
    priceFrom: z.number(),
    meetingPoint: z.string(),
    route: z.string(),
    seoTitle: z.string(),
    seoDescription: z.string(),
    ogImage: z.string(),
    order: z.number(),
  }),
});

export const collections = {
  tours,
};
