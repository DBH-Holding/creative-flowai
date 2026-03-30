import type { IntegrationAdapter } from '@creativeflow/types';
import { logger } from '@creativeflow/utils';

export class LinkedInAdapter implements IntegrationAdapter {
  name = 'linkedin';
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
    logger.info('LinkedIn adapter connected (stub)');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async healthCheck(): Promise<boolean> {
    return this.connected;
  }

  // Future methods:
  // async publishArticle(article: Article): Promise<PublishResult>
  // async sharePost(post: Post): Promise<ShareResult>
}
