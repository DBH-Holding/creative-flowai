import type { FastifyInstance } from 'fastify';
import { prisma } from '@creativeflow/db';
import { getRedisConnection } from '@creativeflow/queue';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', {
    schema: { tags: ['Health'], summary: 'Health check' },
    handler: async (_req, reply) => {
      return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    },
  });

  app.get('/health/ready', {
    schema: { tags: ['Health'], summary: 'Readiness check' },
    handler: async (_req, reply) => {
      const checks: Record<string, boolean> = {};

      // DB check
      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = true;
      } catch {
        checks.database = false;
      }

      // Redis check
      try {
        const redis = getRedisConnection();
        await redis.ping();
        checks.redis = true;
      } catch {
        checks.redis = false;
      }

      const allHealthy = Object.values(checks).every(Boolean);
      return reply.status(allHealthy ? 200 : 503).send({
        status: allHealthy ? 'ready' : 'degraded',
        checks,
        timestamp: new Date().toISOString(),
      });
    },
  });
}
