import type { PrismaClient } from '@prisma/client';
import { ReminderTemplate, ReminderInstance } from '@dailyuse/domain-server';

export class PrismaReminderAggregateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ===== Template CRUD 操作 - 实体接口 =====

  /**
   * 保存 Template 聚合根（包括所有子实体 Instance）
   */
  async saveTemplate(accountUuid: string, template: ReminderTemplate): Promise<ReminderTemplate> {
    const templatePersistence = template.toPersistence(accountUuid);

    // Parse timeConfig JSON
    const timeConfig = JSON.parse(templatePersistence.timeConfig);

    // 使用事务保存 Template 及其所有 Instance
    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert template 主实体
      await tx.reminderTemplate.upsert({
        where: { uuid: templatePersistence.uuid },
        create: {
          uuid: templatePersistence.uuid,
          accountUuid,
          name: templatePersistence.name,
          description: templatePersistence.description,
          message: templatePersistence.message,
          enabled: Boolean(templatePersistence.enabled),
          selfEnabled: Boolean(templatePersistence.selfEnabled),
          importanceLevel: templatePersistence.importanceLevel,
          // Flatten timeConfig
          timeConfigType: timeConfig.type || 'DAILY',
          timeConfigTimes: JSON.stringify(timeConfig.times || []),
          timeConfigWeekdays: JSON.stringify(timeConfig.weekdays || []),
          timeConfigMonthDays: JSON.stringify(timeConfig.monthDays || []),
          timeConfigSchedule: JSON.stringify(timeConfig.schedule || {}),
          priority: templatePersistence.priority,
          category: templatePersistence.category,
          tags: JSON.stringify(templatePersistence.tags),
          version: templatePersistence.version,
          groupUuid: templatePersistence.groupUuid,
        },
        update: {
          name: templatePersistence.name,
          description: templatePersistence.description,
          message: templatePersistence.message,
          enabled: Boolean(templatePersistence.enabled),
          selfEnabled: Boolean(templatePersistence.selfEnabled),
          importanceLevel: templatePersistence.importanceLevel,
          // Flatten timeConfig
          timeConfigType: timeConfig.type || 'DAILY',
          timeConfigTimes: JSON.stringify(timeConfig.times || []),
          timeConfigWeekdays: JSON.stringify(timeConfig.weekdays || []),
          timeConfigMonthDays: JSON.stringify(timeConfig.monthDays || []),
          timeConfigSchedule: JSON.stringify(timeConfig.schedule || {}),
          priority: templatePersistence.priority,
          category: templatePersistence.category,
          tags: JSON.stringify(templatePersistence.tags),
          version: templatePersistence.version,
          groupUuid: templatePersistence.groupUuid,
        },
      });

      // 2. Upsert instances
      for (const instance of template.instances) {
        const instPersistence = (instance as ReminderInstance).toPersistence(accountUuid);
        await tx.reminderInstance.upsert({
          where: { uuid: instPersistence.uuid },
          create: instPersistence,
          update: instPersistence,
        });
      }
    });

    // 重新加载完整的 Template 实体
    const reloaded = await this.prisma.reminderTemplate.findFirst({
      where: { uuid: templatePersistence.uuid, accountUuid },
      include: {
        instances: true,
        schedules: true,
        group: true,
      },
    });

    if (!reloaded) {
      throw new Error('Failed to reload saved template');
    }

    return this.mapTemplateToEntity(reloaded);
  }

  async getAggregatesByAccountUuid(accountUuid: string): Promise<ReminderTemplate[]> {
    try {
      const templates = await this.prisma.reminderTemplate.findMany({
        where: { accountUuid },
        include: {
          instances: true,
          schedules: true,
          group: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return templates.map((t) => this.mapTemplateToEntity(t));
    } catch (error) {
      console.error('获取聚合根列表错误:', error);
      throw new Error(
        `获取账户聚合根列表失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createReminderTemplate(data: any): Promise<any> {
    try {
      const template = await this.prisma.reminderTemplate.create({
        data: {
          uuid: data.uuid,
          accountUuid: data.accountUuid,
          groupUuid: data.groupUuid,
          name: data.name,
          description: data.description,
          message: data.message,
          enabled: data.enabled ?? true,
          category: data.category,
          tags: JSON.stringify(data.tags || []),
          priority: data.priority || 'normal',
          version: 1,
        },
        include: {
          instances: true,
          schedules: true,
          group: true,
        },
      });

      return this.mapTemplateToEntity(template);
    } catch (error) {
      console.error('创建提醒模板错误:', error);
      throw new Error(
        `创建提醒模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async updateReminderTemplate(uuid: string, data: any): Promise<any> {
    try {
      const template = await this.prisma.reminderTemplate.update({
        where: { uuid },
        data: {
          name: data.name,
          description: data.description,
          message: data.message,
          enabled: data.enabled,
          category: data.category,
          tags: JSON.stringify(data.tags || []),
          priority: data.priority,
          groupUuid: data.groupUuid,
          version: { increment: 1 },
        },
        include: {
          instances: true,
          schedules: true,
          group: true,
        },
      });

      return this.mapTemplateToEntity(template);
    } catch (error) {
      console.error('更新提醒模板错误:', error);
      throw new Error(
        `更新提醒模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteReminderTemplate(uuid: string): Promise<void> {
    try {
      await this.prisma.reminderTemplate.delete({
        where: { uuid },
      });
    } catch (error) {
      console.error('删除提醒模板错误:', error);
      throw new Error(
        `删除提醒模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getReminderTemplate(uuid: string): Promise<any | null> {
    try {
      const template = await this.prisma.reminderTemplate.findUnique({
        where: { uuid },
        include: {
          instances: true,
          schedules: true,
          group: true,
        },
      });

      return template ? this.mapTemplateToEntity(template) : null;
    } catch (error) {
      console.error('获取提醒模板错误:', error);
      throw new Error(
        `获取提醒模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getTemplatesByGroupUuid(groupUuid: string): Promise<any[]> {
    try {
      const templates = await this.prisma.reminderTemplate.findMany({
        where: { groupUuid },
        include: {
          instances: true,
          schedules: true,
          group: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return templates.map((template) => this.mapTemplateToEntity(template));
    } catch (error) {
      console.error('获取分组模板错误:', error);
      throw new Error(
        `获取分组模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async searchReminderTemplates(accountUuid: string, searchTerm: string): Promise<any[]> {
    try {
      const templates = await this.prisma.reminderTemplate.findMany({
        where: {
          accountUuid,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { message: { contains: searchTerm, mode: 'insensitive' } },
            { category: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          instances: true,
          schedules: true,
          group: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return templates.map((template) => this.mapTemplateToEntity(template));
    } catch (error) {
      console.error('搜索提醒模板错误:', error);
      throw new Error(
        `搜索提醒模板失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async toggleTemplateEnabled(uuid: string, enabled: boolean): Promise<void> {
    try {
      await this.prisma.reminderTemplate.update({
        where: { uuid },
        data: { enabled, version: { increment: 1 } },
      });
    } catch (error) {
      console.error('切换模板启用状态错误:', error);
      throw new Error(
        `切换模板启用状态失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async batchUpdateTemplateStatus(uuids: string[], enabled: boolean): Promise<void> {
    try {
      await this.prisma.reminderTemplate.updateMany({
        where: { uuid: { in: uuids } },
        data: { enabled, version: { increment: 1 } },
      });
    } catch (error) {
      console.error('批量更新模板状态错误:', error);
      throw new Error(
        `批量更新模板状态失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createReminderInstance(data: any): Promise<any> {
    try {
      const instance = await this.prisma.reminderInstance.create({
        data: {
          uuid: data.uuid,
          templateUuid: data.templateUuid,
          accountUuid: data.accountUuid,
          title: data.title,
          message: data.message,
          scheduledTime: data.scheduledTime,
          status: data.status || 'pending',
          priority: data.priority || 'normal',
          category: data.category,
          tags: JSON.stringify(data.tags || []),
          version: 1,
        },
      });

      return instance;
    } catch (error) {
      console.error('创建提醒实例错误:', error);
      throw new Error(
        `创建提醒实例失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async batchUpdateInstanceStatus(
    templateUuid: string,
    status: string,
    instanceUuids?: string[],
  ): Promise<void> {
    try {
      const whereClause: any = { templateUuid };
      if (instanceUuids) {
        whereClause.uuid = { in: instanceUuids };
      }

      await this.prisma.reminderInstance.updateMany({
        where: whereClause,
        data: { status, version: { increment: 1 } },
      });
    } catch (error) {
      console.error('批量更新实例状态错误:', error);
      throw new Error(
        `批量更新实例状态失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // ===== 分组相关方法 =====

  async createReminderTemplateGroup(data: any): Promise<any> {
    try {
      const group = await this.prisma.reminderTemplateGroup.create({
        data: {
          uuid: data.uuid,
          accountUuid: data.accountUuid,
          parentUuid: data.parentUuid,
          name: data.name,
          description: data.description,
          enabled: data.enabled ?? true,
          enableMode: data.enableMode || 'group',
          icon: data.icon,
          color: data.color,
          sortOrder: data.sortOrder || 0,
        },
        include: {
          parent: true,
          children: true,
          templates: true,
        },
      });

      return this.mapGroupToDTO(group);
    } catch (error) {
      console.error('创建分组错误:', error);
      throw new Error(`创建分组失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateReminderTemplateGroup(uuid: string, data: any): Promise<any> {
    try {
      const group = await this.prisma.reminderTemplateGroup.update({
        where: { uuid },
        data: {
          name: data.name,
          description: data.description,
          enabled: data.enabled,
          enableMode: data.enableMode,
          icon: data.icon,
          color: data.color,
          sortOrder: data.sortOrder,
          parentUuid: data.parentUuid,
        },
        include: {
          parent: true,
          children: true,
          templates: true,
        },
      });

      return this.mapGroupToDTO(group);
    } catch (error) {
      console.error('更新分组错误:', error);
      throw new Error(`更新分组失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteReminderTemplateGroup(uuid: string): Promise<void> {
    try {
      await this.prisma.reminderTemplateGroup.delete({
        where: { uuid },
      });
    } catch (error) {
      console.error('删除分组错误:', error);
      throw new Error(`删除分组失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getReminderTemplateGroup(uuid: string): Promise<any | null> {
    try {
      const group = await this.prisma.reminderTemplateGroup.findUnique({
        where: { uuid },
        include: {
          parent: true,
          children: true,
          templates: true,
        },
      });

      return group ? this.mapGroupToDTO(group) : null;
    } catch (error) {
      console.error('获取分组错误:', error);
      throw new Error(`获取分组失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGroupsByAccountUuid(accountUuid: string): Promise<any[]> {
    try {
      const groups = await this.prisma.reminderTemplateGroup.findMany({
        where: { accountUuid },
        include: {
          parent: true,
          children: true,
          templates: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });

      return groups.map((group) => this.mapGroupToDTO(group));
    } catch (error) {
      console.error('获取账户分组列表错误:', error);
      throw new Error(
        `获取账户分组列表失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async toggleGroupEnabled(uuid: string, enabled: boolean): Promise<void> {
    try {
      await this.prisma.reminderTemplateGroup.update({
        where: { uuid },
        data: { enabled },
      });
    } catch (error) {
      console.error('切换分组启用状态错误:', error);
      throw new Error(
        `切换分组启用状态失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private mapGroupToDTO(group: any): any {
    return {
      uuid: group.uuid,
      accountUuid: group.accountUuid,
      parentUuid: group.parentUuid,
      name: group.name,
      description: group.description,
      enabled: group.enabled,
      enableMode: group.enableMode,
      icon: group.icon,
      color: group.color,
      sortOrder: group.sortOrder,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      parent: group.parent,
      children: group.children || [],
      templates: group.templates || [],
    };
  }

  private mapTemplateToEntity(data: any): ReminderTemplate {
    // 构造完整的 timeConfig JSON 字符串
    const timeConfig = JSON.stringify({
      type: data.timeConfigType || 'DAILY',
      times: JSON.parse(data.timeConfigTimes || '[]'),
      weekdays: JSON.parse(data.timeConfigWeekdays || '[]'),
      monthDays: JSON.parse(data.timeConfigMonthDays || '[]'),
      schedule: JSON.parse(data.timeConfigSchedule || '{}'),
    });

    const entity = ReminderTemplate.fromPersistence({
      ...data,
      tags: typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags || []),
      timeConfig: timeConfig,
    });

    // 转换子实体（参考 Goal 模块）
    if (data.instances) {
      entity.instances = data.instances.map((inst: any) => ReminderInstance.fromPersistence(inst));
    }

    return entity;
  }
}
