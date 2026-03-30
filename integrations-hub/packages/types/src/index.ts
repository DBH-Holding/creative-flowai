// ── Briefing ──
export type BriefingStatus =
  | 'received'
  | 'validated'
  | 'processing'
  | 'sent_to_creativeflow'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'failed';

export interface Briefing {
  id: string;
  externalId?: string | null;
  title: string;
  description: string;
  objective: string;
  targetAudience: string;
  toneOfVoice: string;
  channels: string[];
  campaignType: string;
  attachments: string[];
  references: string[];
  status: BriefingStatus;
  source: string;
  sourceSystem?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBriefingInput {
  externalId?: string;
  title: string;
  description: string;
  objective: string;
  targetAudience: string;
  toneOfVoice: string;
  channels: string[];
  campaignType: string;
  attachments?: string[];
  references?: string[];
  source: string;
  sourceSystem?: string;
  createdBy: string;
}

export interface UpdateBriefingStatusInput {
  status: BriefingStatus;
  notes?: string;
}

// ── Integration Client ──
export interface IntegrationClient {
  id: string;
  name: string;
  apiKey: string;
  status: 'active' | 'inactive' | 'revoked';
  rateLimit: number;
  allowedOrigins: string[];
  createdAt: Date;
}

// ── Webhook Event ──
export interface WebhookEvent {
  id: string;
  provider: string;
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  createdAt: Date;
}

// ── Processing Job ──
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
export type JobType = 'send_to_creativeflow' | 'process_webhook' | 'publish_campaign';

export interface ProcessingJob {
  id: string;
  briefingId: string;
  jobType: JobType;
  status: JobStatus;
  attempts: number;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── API Responses ──
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ── CreativeFlow Webhook Payload ──
export interface CreativeFlowWebhookPayload {
  briefingId: string;
  status: 'completed' | 'failed' | 'processing';
  observations?: string;
  assets?: string[];
  logs?: string[];
  timestamps: {
    receivedAt: string;
    processedAt?: string;
    completedAt?: string;
  };
}

// ── Integration Adapter ──
export interface IntegrationAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  healthCheck(): Promise<boolean>;
}
