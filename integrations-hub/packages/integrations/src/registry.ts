import type { IntegrationAdapter } from '@creativeflow/types';
import { logger } from '@creativeflow/utils';

export class AdapterRegistry {
  private adapters = new Map<string, IntegrationAdapter>();

  register(adapter: IntegrationAdapter): void {
    this.adapters.set(adapter.name, adapter);
    logger.info({ adapter: adapter.name }, 'Adapter registered');
  }

  get(name: string): IntegrationAdapter | undefined {
    return this.adapters.get(name);
  }

  getAll(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, adapter] of this.adapters) {
      try {
        results[name] = await adapter.healthCheck();
      } catch {
        results[name] = false;
      }
    }
    return results;
  }
}
