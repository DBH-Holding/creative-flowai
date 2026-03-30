import type { ApiResponse, PaginationMeta } from '@creativeflow/types';

export function success<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function error(message: string): ApiResponse {
  return { success: false, error: message };
}

export function paginated<T>(data: T, meta: PaginationMeta, message?: string): ApiResponse<T> {
  return { success: true, data, meta, message };
}
