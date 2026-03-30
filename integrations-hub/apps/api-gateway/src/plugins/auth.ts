import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '@creativeflow/db';
import { hashApiKey, UnauthorizedError } from '@creativeflow/utils';
import { config } from '@creativeflow/config';

async function auth(app: FastifyInstance) {
  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedError('Missing X-API-Key header');
    }

    const keyHash = hashApiKey(apiKey, config.auth.apiKeySalt);

    const client = await prisma.integrationClient.findUnique({
      where: { apiKeyHash: keyHash },
    });

    if (!client || client.status !== 'active') {
      throw new UnauthorizedError('Invalid or inactive API key');
    }

    (request as any).client = client;
  });
}

export const authPlugin = fp(auth);

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
