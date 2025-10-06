import { PrismaClient } from '@prisma/client';
import type { IReminderTemplateGroupAggregateRepository } from '@dailyuse/domain-server';
import { ReminderTemplateGroup, ReminderTemplate } from '@dailyuse/domain-server';

/**
 * ReminderTemplateGroup 聚合根 Prisma 仓储实现
 * 负责 ReminderTemplateGroup 及其所有关联 ReminderTemplate 的持久化
 */
export class PrismaReminderTemplateGroupAggregateRepository
  implements IReminderTemplateGroupAggregateRepository
{
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 ReminderTemplateGroup 聚合根实体
   */
  private mapToEntity(data: any): ReminderTemplateGroup {
    const groupEntity = ReminderTemplateGroup.fromPersistence(data);

    // 加载关联的 ReminderTemplate
    if (data.templates) {
      data.templates.forEach((templateData: any) => {
        const templateEntity = ReminderTemplate.fromPersistence(templateData);
        (groupEntity as any).templates.push(templateEntity);
      });
    }

    return groupEntity;
  }

  // ===== ReminderTemplateGroup 聚合根 CRUD =====

  async saveGroup(
    accountUuid: string,
    group: ReminderTemplateGroup,
  ): Promise<ReminderTemplateGroup> {
    const persistence = group.toPersistence(accountUuid);

    await this.prisma.reminderTemplateGroup.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        accountUuid: persistence.accountUuid,
        name: persistence.name,
        description: persistence.description,
        enabled: persistence.enabled,
        enableMode: persistence.enableMode,
        parentUuid: persistence.parentUuid,
        icon: persistence.icon,
        color: persistence.color,
        sortOrder: persistence.sortOrder,
        createdAt: persistence.createdAt,
        updatedAt: persistence.updatedAt,
      },
      update: {
        name: persistence.name,
        description: persistence.description,
        enabled: persistence.enabled,
        enableMode: persistence.enableMode,
        parentUuid: persistence.parentUuid,
        icon: persistence.icon,
        color: persistence.color,
        sortOrder: persistence.sortOrder,
        updatedAt: persistence.updatedAt,
      },
    });

    return group;
  }

  async getGroupByUuid(accountUuid: string, uuid: string): Promise<ReminderTemplateGroup | null> {
    const data = await this.prisma.reminderTemplateGroup.findFirst({
      where: { uuid, accountUuid },
      include: {
        templates: true,
      },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async getAllGroups(
    accountUuid: string,
    params?: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'order' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ groups: ReminderTemplateGroup[]; total: number }> {
    const where: any = { accountUuid };
    if (params?.isActive !== undefined) where.enabled = params.isActive;

    const [data, total] = await Promise.all([
      this.prisma.reminderTemplateGroup.findMany({
        where,
        include: {
          templates: true,
        },
        skip: params?.offset || 0,
        take: params?.limit || 50,
        orderBy: {
          [params?.sortBy === 'order' ? 'sortOrder' : params?.sortBy || 'sortOrder']:
            params?.sortOrder || 'asc',
        },
      }),
      this.prisma.reminderTemplateGroup.count({ where }),
    ]);

    return {
      groups: data.map((item) => this.mapToEntity(item)),
      total,
    };
  }

  async deleteGroup(accountUuid: string, uuid: string): Promise<boolean> {
    try {
      // 注意：删除 Group 不会级联删除 Template（Template 只是解除关联）
      await this.prisma.$transaction(async (tx) => {
        // 1. 解除所有关联的 Template 的 groupUuid
        await tx.reminderTemplate.updateMany({
          where: { groupUuid: uuid },
          data: { groupUuid: null },
        });

        // 2. 删除 Group
        await tx.reminderTemplateGroup.delete({
          where: { uuid, accountUuid },
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  async countGroups(accountUuid: string, isActive?: boolean): Promise<number> {
    const where: any = { accountUuid };
    if (isActive !== undefined) where.enabled = isActive;

    return this.prisma.reminderTemplateGroup.count({ where });
  }

  async groupExists(accountUuid: string, uuid: string): Promise<boolean> {
    const count = await this.prisma.reminderTemplateGroup.count({
      where: { uuid, accountUuid },
    });
    return count > 0;
  }

  async updateGroupOrder(
    accountUuid: string,
    groupOrders: Array<{ uuid: string; order: number }>,
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction(
        groupOrders.map((item) =>
          this.prisma.reminderTemplateGroup.update({
            where: { uuid: item.uuid, accountUuid },
            data: { sortOrder: item.order, updatedAt: new Date() },
          }),
        ),
      );
      return true;
    } catch {
      return false;
    }
  }
}
