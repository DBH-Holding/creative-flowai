import { createWorker, QUEUES } from '@creativeflow/queue';
import { prisma } from '@creativeflow/db';
import { logger } from '@creativeflow/utils';

async function bootstrap() {
  createWorker(
    QUEUES.WEBHOOK_PROCESSING,
    async (job) => {
      const { eventId, payload } = job.data as { eventId: string; payload: any };

      logger.info({ eventId }, 'Processing webhook event');

      try {
        const briefingId = payload.briefingId;

        if (briefingId) {
          const briefing = await prisma.briefing.findUnique({ where: { id: briefingId } });

          if (briefing) {
            const statusMap: Record<string, string> = {
              completed: 'approved',
              failed: 'failed',
              processing: 'processing',
            };

            const newStatus = statusMap[payload.status];
            if (newStatus) {
              await prisma.briefing.update({
                where: { id: briefingId },
                data: { status: newStatus as any },
              });
              logger.info({ briefingId, newStatus }, 'Briefing status updated from webhook');
            }
          }
        }

        // Mark event as processed
        await prisma.webhookEvent.update({
          where: { id: eventId },
          data: { processed: true },
        });

        logger.info({ eventId }, 'Webhook event processed');
      } catch (error: any) {
        logger.error({ eventId, error: error.message }, 'Webhook processing failed');
        throw error;
      }
    },
    { concurrency: 5 },
  );

  logger.info('📡 Webhook Service worker started');
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start Webhook Service');
  process.exit(1);
});
