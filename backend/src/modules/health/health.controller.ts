import type { Request, Response } from 'express';
import { sendSuccess } from '@/shared/utils/api-response';
import { healthService } from './health.service';

export const healthController = {
  getStatus(_req: Request, res: Response) {
    sendSuccess(res, healthService.getStatus());
  },
};
