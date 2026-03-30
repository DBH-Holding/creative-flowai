import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create a test integration client
  const apiKey = 'cfk_test_key_for_development_only';
  const hash = createHash('sha256').update(`dev-salt:${apiKey}`).digest('hex');

  await prisma.integrationClient.upsert({
    where: { name: 'Test Client' },
    update: {},
    create: {
      name: 'Test Client',
      apiKeyHash: hash,
      status: 'active',
      rateLimit: 100,
      allowedOrigins: ['*'],
    },
  });

  // Create a sample briefing
  await prisma.briefing.upsert({
    where: { externalId: 'sample-001' },
    update: {},
    create: {
      externalId: 'sample-001',
      title: 'Campanha de Lançamento Q1',
      description: 'Campanha de marketing digital para lançamento do novo produto.',
      objective: 'Gerar awareness e leads qualificados',
      targetAudience: 'PMEs do setor de tecnologia, 25-45 anos',
      toneOfVoice: 'Profissional e inovador',
      channels: ['instagram', 'linkedin', 'google_ads'],
      campaignType: 'launch',
      attachments: [],
      references: ['https://example.com/reference'],
      source: 'manual',
      sourceSystem: 'seed',
      createdBy: 'system',
      status: 'received',
    },
  });

  console.log('✅ Seed completed');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
