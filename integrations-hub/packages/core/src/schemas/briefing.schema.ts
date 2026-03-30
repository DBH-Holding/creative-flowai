import { z } from 'zod';

export const createBriefingSchema = z.object({
  externalId: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  objective: z.string().min(3).max(500),
  targetAudience: z.string().min(3).max(500),
  toneOfVoice: z.string().min(2).max(100),
  channels: z.array(z.string()).min(1),
  campaignType: z.string().min(2).max(50),
  attachments: z.array(z.string().url()).optional().default([]),
  references: z.array(z.string().url()).optional().default([]),
  source: z.string().min(2).max(50),
  sourceSystem: z.string().max(100).optional(),
  createdBy: z.string().min(1),
});

export const updateBriefingStatusSchema = z.object({
  status: z.enum([
    'received',
    'validated',
    'processing',
    'sent_to_creativeflow',
    'approved',
    'rejected',
    'published',
    'failed',
  ]),
  notes: z.string().max(1000).optional(),
});

export const briefingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      'received',
      'validated',
      'processing',
      'sent_to_creativeflow',
      'approved',
      'rejected',
      'published',
      'failed',
    ])
    .optional(),
  source: z.string().optional(),
});
