import { nanoid } from 'nanoid';
import { createHash } from 'crypto';

export function generateId(prefix?: string): string {
  const id = nanoid(21);
  return prefix ? `${prefix}_${id}` : id;
}

export function generateApiKey(): string {
  return `cfk_${nanoid(40)}`;
}

export function hashApiKey(key: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${key}`).digest('hex');
}
