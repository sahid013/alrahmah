import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '@/shared/errors/app-error';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates and coerces request parts. Parsed values are stored on `res.locals.validated`
 * (Express 5 makes `req.query` read-only), and `req.body` is replaced with the parsed body.
 */
export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req, res, next) => {
    const validated: Record<string, unknown> = {};

    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return next(
          new ValidationError(
            result.error.issues.map((issue) => ({
              location: key,
              path: issue.path.join('.'),
              message: issue.message,
            })),
          ),
        );
      }
      validated[key] = result.data;
    }

    if (validated.body !== undefined) req.body = validated.body;
    res.locals.validated = validated;
    next();
  };
