import { Queue, Worker, type Job, type WorkerOptions, type QueueOptions } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@creativeflow/config';
import { logger } from '@creativeflow/utils';

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function createQueue<T = unknown>(name: string, opts?: Partial<QueueOptions>): Queue<T> {
  return new Queue<T>(name, {
    connection: getRedisConnection(),
    ...opts,
  });
}

export function createWorker<T = unknown>(
  name: string,
  processor: (job: Job<T>) => Promise<void>,
  opts?: Partial<WorkerOptions>,
): Worker<T> {
  const worker = new Worker<T>(name, processor, {
    connection: getRedisConnection(),
    concurrency: 5,
    ...opts,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: name }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, queue: name, error: err.message }, 'Job failed');
  });

  return worker;
}

// Queue names
export const QUEUES = {
  BRIEFING_PROCESSING: 'briefing-processing',
  WEBHOOK_PROCESSING: 'webhook-processing',
  CAMPAIGN_PUBLISHING: 'campaign-publishing',
} as const;

// Pre-configured queues
export const briefingQueue = createQueue(QUEUES.BRIEFING_PROCESSING);
export const webhookQueue = createQueue(QUEUES.WEBHOOK_PROCESSING);

export { Queue, Worker, type Job } from 'bullmq';
