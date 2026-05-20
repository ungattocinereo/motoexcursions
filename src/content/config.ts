import { defineCollection, z } from 'astro:content';

const tours = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    coverImage: z.string(),
    gallery: z.array(z.string()).optional(),
    excerpt: z.string(),
    highlights: z.array(z.string()),
    duration: z.string(),
    priceFrom: z.number(),
    priceNote: z.string().optional(),
    meetingPoint: z.string(),
    route: z.string(),
    heroKicker: z.string().optional(),
    bookingFacts: z.array(z.object({
      icon: z.string(),
      label: z.string(),
      value: z.string(),
    })).optional(),
    seoTitle: z.string(),
    seoDescription: z.string(),
    ogImage: z.string(),
    order: z.number(),
  }),
});

export const collections = {
  tours,
};
