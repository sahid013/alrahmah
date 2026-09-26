import { Router } from 'express';
import { healthRouter } from '@/modules/health/health.routes';

/** Register every feature module's router here. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
