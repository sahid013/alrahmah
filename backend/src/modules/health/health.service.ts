import type { HealthStatus } from './health.types';

export const healthService = {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  },
};
