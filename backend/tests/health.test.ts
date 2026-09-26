import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '@/app';
import { slugify } from '@/shared/utils/slugify';

const app = createApp();

describe('GET /api/v1/health', () => {
  it('returns the standard success envelope', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('returns a 404 error envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
});

describe('slugify', () => {
  it('creates SEO-friendly slugs', () => {
    expect(slugify('  Zakat Guide: 2026 Édition! ')).toBe('zakat-guide-2026-edition');
  });
});
