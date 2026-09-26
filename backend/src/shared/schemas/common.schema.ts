import { z } from 'zod';
import { PAGINATION, SEO_LIMITS } from '@/config/constants';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase, hyphenated slug');

export const slugParamsSchema = z.object({ slug: slugSchema });

/** Reusable SEO fields — spread into any public content schema. */
export const seoFieldsSchema = z.object({
  metaTitle: z.string().max(SEO_LIMITS.META_TITLE_MAX).optional(),
  metaDescription: z.string().max(SEO_LIMITS.META_DESCRIPTION_MAX).optional(),
  canonicalUrl: z.url().optional(),
  ogImage: z.url().optional(),
  noindex: z.boolean().default(false),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SeoFields = z.infer<typeof seoFieldsSchema>;
