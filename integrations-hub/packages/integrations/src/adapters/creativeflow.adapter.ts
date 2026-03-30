import type { IntegrationAdapter, Briefing } from '@creativeflow/types';
import { config } from '@creativeflow/config';
import { logger } from '@creativeflow/utils';

export class CreativeFlowAdapter implements IntegrationAdapter {
  name = 'creativeflow';
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
    logger.info('CreativeFlow adapter connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async healthCheck(): Promise<boolean> {
    if (!config.creativeflow.apiUrl) return false;
    try {
      const res = await fetch(`${config.creativeflow.apiUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async sendBriefing(briefing: Briefing): Promise<{ success: boolean; message: string }> {
    logger.info({ briefingId: briefing.id }, 'Sending briefing to CreativeFlow AI');

    if (!config.creativeflow.apiUrl) {
      // Mock mode
      logger.warn('CreativeFlow API URL not configured — using mock');
      return { success: true, message: 'Mock: briefing accepted' };
    }

    const response = await fetch(`${config.creativeflow.apiUrl}/generate-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.creativeflow.apiKey}`,
      },
      body: JSON.stringify({
        campaign_name: briefing.title,
        objective: briefing.objective,
        target_audience: briefing.targetAudience,
        main_channel: briefing.channels[0] ?? 'instagram',
        notes: briefing.description,
        business_segment: briefing.campaignType,
      }),
    });

    if (!response.ok) {
      throw new Error(`CreativeFlow API error: ${response.status}`);
    }

    return { success: true, message: 'Briefing sent to CreativeFlow AI' };
  }
}
