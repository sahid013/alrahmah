import type { ErrorRequestHandler } from 'express';
import { isProduction } from '@/config/env';
import { AppError } from '@/shared/errors/app-error';
import type { ApiFailure } from '@/shared/utils/api-response';
import { logger } from '@/shared/utils/logger';

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const isBodyParseError =
    err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed';

  const appError =
    err instanceof AppError
      ? err
      : isBodyParseError
        ? new AppError('Malformed JSON body', 400, 'BAD_REQUEST')
        : new AppError(
            isProduction ? 'Internal server error' : String((err as Error)?.message ?? err),
          );

  if (appError.statusCode >= 500) logger.error({ err }, 'Unhandled error');

  const body: ApiFailure = {
    success: false,
    error: { code: appError.code, message: appError.message },
  };
  if (appError.details !== undefined) body.error.details = appError.details;

  res.status(appError.statusCode).json(body);
};
