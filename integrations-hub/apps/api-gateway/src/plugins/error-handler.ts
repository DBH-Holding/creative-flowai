import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@creativeflow/utils';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, _req: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
      code: error.code,
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.errors,
    });
  }

  // Rate limit
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: 'Too many requests',
    });
  }

  reply.status(500).send({
    success: false,
    error: 'Internal server error',
  });
}
