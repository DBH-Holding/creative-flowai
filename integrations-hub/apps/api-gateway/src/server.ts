import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from '@creativeflow/config';
import { logger } from '@creativeflow/utils';
import { briefingRoutes } from './routes/briefing.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { healthRoutes } from './routes/health.routes';
import { errorHandler } from './plugins/error-handler';
import { authPlugin } from './plugins/auth';

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: config.logging.level,
      transport: config.isDev ? { target: 'pino-pretty' } : undefined,
    },
  });

  // Plugins
  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
  });

  // Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'CreativeFlow Integrations Hub',
        description: 'API para integrações do CreativeFlow AI',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${config.api.port}` }],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
        },
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Error handler
  app.setErrorHandler(errorHandler);

  // Auth
  await app.register(authPlugin);

  // Routes
  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(briefingRoutes, { prefix: '/api/v1' });
  await app.register(webhookRoutes, { prefix: '/api/v1' });

  // Start
  await app.listen({ port: config.api.port, host: config.api.host });
  logger.info(`🚀 API Gateway running at http://localhost:${config.api.port}`);
  logger.info(`📚 Swagger docs at http://localhost:${config.api.port}/docs`);
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start API Gateway');
  process.exit(1);
});
