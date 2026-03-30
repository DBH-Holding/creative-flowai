import type { FastifyInstance } from 'fastify';
import { prisma } from '@creativeflow/db';
import { success, logger } from '@creativeflow/utils';
import { webhookQueue } from '@creativeflow/queue';
import type { CreativeFlowWebhookPayload } from '@creativeflow/types';

export async function webhookRoutes(app: FastifyInstance) {
  // CreativeFlow webhook
  app.post('/webhooks/creativeflow', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Receive webhook from CreativeFlow AI',
    },
    handler: async (request, reply) => {
      const payload = request.body as CreativeFlowWebhookPayload;

      // Store event
      const event = await prisma.webhookEvent.create({
        data: {
          provider: 'creativeflow',
          eventType: `briefing.${payload.status}`,
          payload: payload as any,
          processed: false,
        },
      });

      // Enqueue for processing
      await webhookQueue.add('process-webhook', {
        eventId: event.id,
        payload,
      });

      logger.info({ eventId: event.id, briefingId: payload.briefingId }, 'CreativeFlow webhook received');

      return reply.status(200).send(success({ eventId: event.id }, 'Webhook received'));
    },
  });
}
