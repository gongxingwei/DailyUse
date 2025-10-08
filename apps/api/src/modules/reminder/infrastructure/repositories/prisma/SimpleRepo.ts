import type { PrismaClient } from '@prisma/client';

export class PrismaReminderAggregateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAggregatesByAccountUuid(accountUuid: string): Promise<any[]> {
    try {
      const templates = await this.prisma.reminderTemplate.findMany({
        where: { accountUuid },
        include: {
          // instances 和 schedules 在当前 schema 中不存在，已移除
          group: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return templates.map((template) => ({
        uuid: template.uuid,
        accountUuid: template.accountUuid,
        name: template.name,
        description: template.description,
        message: template.message,
        enabled: template.enabled,
        priority: template.priority,
        category: template.category,
        tags: template.tags ? JSON.parse(template.tags) : [],
        groupUuid: template.groupUuid,
        version: template.version || 1,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        // instances 和 schedules 数据需要单独查询
        instances: [],
        schedules: [],
      }));
    } catch (error) {
      console.error('获取聚合根列表错误:', error);
      throw new Error(
        `获取账户聚合根列表失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
