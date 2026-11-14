import { z } from 'astro/zod';
import { ALLERGENS, DIETARY_TAGS } from '@/entities/menu';
import { SOCIAL_NETWORKS } from '@/entities/site';

/**
 * Zod schemas for the content collections. They validate the JSON files at build time, so a typo in
 * src/content fails the build with a precise message instead of shipping a broken page.
 */

const time = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Use 24h HH:MM');

const dayHours = z.object({ open: time, close: time }).nullable();

const navLink = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const siteSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  locale: z.string().default('en-IE'),
  currency: z.string().length(3),
  contact: z.object({
    phone: z.string().min(5),
    email: z.email(),
    whatsapp: z.url(),
  }),
  address: z.object({
    lines: z.array(z.string().min(1)).min(1),
    mapUrl: z.url(),
  }),
  hours: z.object({
    timezone: z.string().min(1),
    weekly: z.object({
      mon: dayHours,
      tue: dayHours,
      wed: dayHours,
      thu: dayHours,
      fri: dayHours,
      sat: dayHours,
      sun: dayHours,
    }),
  }),
  socials: z.array(
    z.object({
      network: z.enum(SOCIAL_NETWORKS),
      label: z.string().min(1),
      href: z.url(),
    }),
  ),
});

export const homeSchema = z.object({
  seo: z.object({ title: z.string().min(1), description: z.string().min(50).max(200) }),
  nav: z.object({ links: z.array(navLink).min(1), callLabel: z.string().min(1) }),
  hero: z.object({
    title: z.tuple([z.string(), z.string()]),
    text: z.string().min(1),
    cta: navLink,
    scrollLabel: z.string().min(1),
  }),
  about: z.object({
    eyebrow: z.string().min(1),
    title: z.tuple([z.string(), z.string()]),
    text: z.string().min(1),
    cta: navLink,
  }),
  popular: z.object({ title: z.string().min(1) }),
  menu: z.object({ eyebrow: z.string().min(1), title: z.string().min(1), intro: z.string().min(1) }),
  follow: z.object({
    eyebrow: z.string().min(1),
    title: z.tuple([z.string(), z.string()]),
    callLabel: z.string().min(1),
    whatsappLabel: z.string().min(1),
    instagramLabel: z.string().min(1),
  }),
  visit: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    text: z.string().min(1),
    directionsLabel: z.string().min(1),
    hoursTitle: z.string().min(1),
  }),
  notFound: z.object({ title: z.string().min(1), text: z.string().min(1), homeLabel: z.string().min(1) }),
  footer: z.object({
    blurb: z.string().min(1),
    columns: z.array(z.object({ title: z.string().min(1), links: z.array(navLink).min(1) })).min(1),
    addressTitle: z.string().min(1),
    rights: z.string().min(1),
  }),
});

export const categorySchema = z.object({
  title: z.string().min(1),
  blurb: z.string().min(1),
  order: z.number().int(),
});

export const itemSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(10),
  /** Major units (8.5 = 8.50); converted to integer minor units when mapped to the entity. */
  price: z.number().positive(),
  sizes: z.array(z.object({ label: z.string().min(1), price: z.number().positive() })).default([]),
  /** Key into src/assets, e.g. "food/pizza". */
  image: z.string().min(1),
  allergens: z.array(z.enum(ALLERGENS)).default([]),
  tags: z.array(z.enum(DIETARY_TAGS)).default([]),
  popular: z.boolean().default(false),
  order: z.number().int().default(0),
});
