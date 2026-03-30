import type { FastifyInstance } from 'fastify';
import { BriefingService, createBriefingSchema, updateBriefingStatusSchema, briefingQuerySchema } from '@creativeflow/core';
import { success, paginated } from '@creativeflow/utils';

const service = new BriefingService();

export async function briefingRoutes(app: FastifyInstance) {
  // Create briefing
  app.post('/briefings', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Briefings'],
      summary: 'Create a new briefing',
      security: [{ apiKey: [] }],
    },
    handler: async (request, reply) => {
      const input = createBriefingSchema.parse(request.body);
      const briefing = await service.create(input);
      return reply.status(201).send(success(briefing, 'Briefing created'));
    },
  });

  // List briefings
  app.get('/briefings', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Briefings'],
      summary: 'List briefings with pagination and filters',
      security: [{ apiKey: [] }],
    },
    handler: async (request, reply) => {
      const query = briefingQuerySchema.parse(request.query);
      const result = await service.list(query);
      return reply.send(
        paginated(result.data, {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        }),
      );
    },
  });

  // Get briefing by ID
  app.get('/briefings/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Briefings'],
      summary: 'Get briefing by ID',
      security: [{ apiKey: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const briefing = await service.getById(id);
      return reply.send(success(briefing));
    },
  });

  // Update briefing status
  app.patch('/briefings/:id/status', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Briefings'],
      summary: 'Update briefing status',
      security: [{ apiKey: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const input = updateBriefingStatusSchema.parse(request.body);
      const briefing = await service.updateStatus(id, input.status, input.notes);
      return reply.send(success(briefing, 'Status updated'));
    },
  });
}
