/**
 * Prisma Task Repositories Index
 */

export { PrismaTaskTemplateRepository } from './PrismaTaskTemplateRepository';
export { PrismaTaskInstanceRepository } from './PrismaTaskInstanceRepository';
export { PrismaTaskMetaTemplateRepository } from './PrismaTaskMetaTemplateRepository';

// 注意：PrismaTaskStatsRepository 可能需要单独创建
// 目前先导出一个简单的实现
export class PrismaTaskStatsRepository {
  constructor(private prisma: any) {}

  async getAccountStats(accountUuid: string): Promise<any> {
    // TODO: 实现统计逻辑
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
    };
  }
}
