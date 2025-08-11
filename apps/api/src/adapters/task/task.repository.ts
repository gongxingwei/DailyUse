import { prisma } from '../../config/prisma';
import type { Task, TaskRepositoryPort } from '@dailyuse/domain';

const TASK_PREFIX = 'task:';

export class TaskRepository implements TaskRepositoryPort {
  constructor(private readonly userId: string) {}

  private fileName(id: string) {
    return `${TASK_PREFIX}${id}`;
  }

  async getById(id: string): Promise<Task | null> {
    const row = await prisma.userData.findFirst({
      where: {
        userId: this.userId,
        fileName: this.fileName(id),
      },
    });
    if (!row) return null;
    const content = row.fileContent as unknown as Task;
    return {
      id: content.id,
      title: content.title,
      status: content.status,
      updatedAt: content.updatedAt,
    };
  }

  async list(params?: { updatedAfter?: string }): Promise<Task[]> {
    const rows = await prisma.userData.findMany({
      where: {
        userId: this.userId,
        fileName: { startsWith: TASK_PREFIX },
        ...(params?.updatedAfter ? { lastModified: { gt: new Date(params.updatedAfter) } } : {}),
      },
      orderBy: { lastModified: 'desc' },
    });
    return rows.map((r) => r.fileContent as unknown as Task);
  }

  async save(task: Task): Promise<void> {
    const fileName = this.fileName(task.id);
    // Try update; if not exists, create
    const updated = await prisma.userData.updateMany({
      where: { userId: this.userId, fileName },
      data: { fileContent: task as unknown as any, version: { increment: 1 } },
    });
    if (updated.count === 0) {
      await prisma.userData.create({
        data: {
          userId: this.userId,
          fileName,
          fileContent: task as unknown as any,
        },
      });
    }
  }
}
