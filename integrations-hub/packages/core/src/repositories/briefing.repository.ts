import { prisma } from '@creativeflow/db';
import type { BriefingStatus } from '@creativeflow/types';

export class BriefingRepository {
  async create(data: {
    externalId?: string;
    title: string;
    description: string;
    objective: string;
    targetAudience: string;
    toneOfVoice: string;
    channels: string[];
    campaignType: string;
    attachments: string[];
    references: string[];
    source: string;
    sourceSystem?: string;
    createdBy: string;
  }) {
    return prisma.briefing.create({ data });
  }

  async findById(id: string) {
    return prisma.briefing.findUnique({ where: { id }, include: { processingJobs: true } });
  }

  async findByExternalId(externalId: string) {
    return prisma.briefing.findUnique({ where: { externalId } });
  }

  async findMany(params: {
    page: number;
    limit: number;
    status?: BriefingStatus;
    source?: string;
  }) {
    const { page, limit, status, source } = params;
    const where = {
      ...(status && { status }),
      ...(source && { source }),
    };

    const [data, total] = await Promise.all([
      prisma.briefing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.briefing.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: BriefingStatus) {
    return prisma.briefing.update({ where: { id }, data: { status } });
  }

  async createJob(data: { briefingId: string; jobType: 'send_to_creativeflow' | 'process_webhook' | 'publish_campaign' }) {
    return prisma.processingJob.create({ data });
  }
}
