import { BriefingRepository } from '../repositories/briefing.repository';
import { briefingQueue } from '@creativeflow/queue';
import { logger, NotFoundError, ValidationError } from '@creativeflow/utils';
import type { BriefingStatus, CreateBriefingInput } from '@creativeflow/types';

export class BriefingService {
  private repo = new BriefingRepository();

  async create(input: CreateBriefingInput) {
    // Idempotency check
    if (input.externalId) {
      const existing = await this.repo.findByExternalId(input.externalId);
      if (existing) {
        logger.warn({ externalId: input.externalId }, 'Duplicate briefing detected');
        return existing;
      }
    }

    const briefing = await this.repo.create({
      ...input,
      attachments: input.attachments ?? [],
      references: input.references ?? [],
    });

    logger.info({ briefingId: briefing.id }, 'Briefing created');

    // Update status to validated
    await this.repo.updateStatus(briefing.id, 'validated');

    // Create processing job
    const job = await this.repo.createJob({
      briefingId: briefing.id,
      jobType: 'send_to_creativeflow',
    });

    // Enqueue for async processing
    await briefingQueue.add('process-briefing', {
      briefingId: briefing.id,
      jobId: job.id,
    });

    logger.info({ briefingId: briefing.id, jobId: job.id }, 'Briefing enqueued for processing');

    return { ...briefing, status: 'validated' as const };
  }

  async getById(id: string) {
    const briefing = await this.repo.findById(id);
    if (!briefing) throw new NotFoundError('Briefing', id);
    return briefing;
  }

  async list(params: { page: number; limit: number; status?: BriefingStatus; source?: string }) {
    return this.repo.findMany(params);
  }

  async updateStatus(id: string, status: BriefingStatus, _notes?: string) {
    const briefing = await this.repo.findById(id);
    if (!briefing) throw new NotFoundError('Briefing', id);

    const validTransitions: Record<string, string[]> = {
      received: ['validated', 'failed'],
      validated: ['processing', 'failed'],
      processing: ['sent_to_creativeflow', 'failed'],
      sent_to_creativeflow: ['approved', 'rejected', 'failed'],
      approved: ['published', 'failed'],
      rejected: ['received'],
      published: [],
      failed: ['received'],
    };

    const allowed = validTransitions[briefing.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ValidationError(`Cannot transition from ${briefing.status} to ${status}`);
    }

    return this.repo.updateStatus(id, status);
  }
}
