import type { IntegrationAdapter } from '@creativeflow/types';
import { logger } from '@creativeflow/utils';

export class InstagramAdapter implements IntegrationAdapter {
  name = 'instagram';
  private connected = false;

  async connect(): Promise<void> {
    // TODO: Implement Meta Graph API OAuth
    this.connected = true;
    logger.info('Instagram adapter connected (stub)');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async healthCheck(): Promise<boolean> {
    // TODO: Check Meta Graph API connectivity
    return this.connected;
  }

  // Future methods:
  // async publishPost(post: Post): Promise<PublishResult>
  // async getInsights(postId: string): Promise<Insights>
  // async uploadMedia(file: Buffer): Promise<MediaId>
}
