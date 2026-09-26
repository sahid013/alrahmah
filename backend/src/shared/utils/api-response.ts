import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const sendSuccess = <T>(
  res: Response,
  data: T,
  options: { status?: number; meta?: Record<string, unknown> } = {},
): Response<ApiSuccess<T>> => {
  const body: ApiSuccess<T> = { success: true, data };
  if (options.meta) body.meta = options.meta;
  return res.status(options.status ?? 200).json(body);
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
