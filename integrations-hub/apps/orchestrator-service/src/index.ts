import { logger } from '@creativeflow/utils';
import { AdapterRegistry, InstagramAdapter, LinkedInAdapter } from '@creativeflow/integrations';

async function bootstrap() {
  const registry = new AdapterRegistry();

  // Register available adapters
  registry.register(new InstagramAdapter());
  registry.register(new LinkedInAdapter());

  logger.info('🎯 Orchestrator Service started');
  logger.info(`Registered adapters: ${registry.getAll().map((a) => a.name).join(', ')}`);

  // Health check loop
  setInterval(async () => {
    const health = await registry.healthCheckAll();
    logger.debug({ health }, 'Adapter health check');
  }, 60_000);

  // Keep process alive
  process.on('SIGINT', () => {
    logger.info('Orchestrator shutting down...');
    process.exit(0);
  });

  // TODO: Add campaign orchestration logic
  // - Listen for approved briefings
  // - Coordinate publishing across channels
  // - Handle approval workflows
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start Orchestrator');
  process.exit(1);
});
