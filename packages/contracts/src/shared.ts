import { z } from 'zod';

export const PaginationQuery = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

export const Paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
  });

export const ErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  traceId: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
