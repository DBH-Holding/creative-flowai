import { createWorker, QUEUES } from '@creativeflow/queue';
import { prisma } from '@creativeflow/db';
import { CreativeFlowAdapter } from '@creativeflow/integrations';
import { logger } from '@creativeflow/utils';
import type { Briefing } from '@creativeflow/types';

const creativeflow = new CreativeFlowAdapter();

async function bootstrap() {
  await creativeflow.connect();

  createWorker(
    QUEUES.BRIEFING_PROCESSING,
    async (job) => {
      const { briefingId, jobId } = job.data as { briefingId: string; jobId: string };

      logger.info({ briefingId, jobId }, 'Processing briefing');

      // Update job status
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { status: 'processing', attempts: { increment: 1 } },
      });

      // Update briefing status
      await prisma.briefing.update({
        where: { id: briefingId },
        data: { status: 'processing' },
      });

      try {
        // Get full briefing
        const briefing = await prisma.briefing.findUniqueOrThrow({ where: { id: briefingId } });

        // Send to CreativeFlow
        const result = await creativeflow.sendBriefing(briefing as unknown as Briefing);

        // Update statuses
        await prisma.briefing.update({
          where: { id: briefingId },
          data: { status: 'sent_to_creativeflow' },
        });

        await prisma.processingJob.update({
          where: { id: jobId },
          data: { status: 'completed' },
        });

        logger.info({ briefingId, result }, 'Briefing sent to CreativeFlow');
      } catch (error: any) {
        await prisma.processingJob.update({
          where: { id: jobId },
          data: { status: 'failed', lastError: error.message },
        });

        await prisma.briefing.update({
          where: { id: briefingId },
          data: { status: 'failed' },
        });

        throw error; // Let BullMQ handle retry
      }
    },
    { concurrency: 3 },
  );

  logger.info('🔧 Briefing Service worker started');
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start Briefing Service');
  process.exit(1);
});
