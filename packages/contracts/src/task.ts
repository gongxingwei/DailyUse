import { z } from 'zod';

export const TaskDto = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(['todo', 'doing', 'done']),
  updatedAt: z.string().datetime(),
});
export type TaskDto = z.infer<typeof TaskDto>;

export const CreateTaskInput = z.object({ id: z.string().uuid(), title: z.string().min(1) });
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;
