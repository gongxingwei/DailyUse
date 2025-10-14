import { PrismaClient } from '@prisma/client';
import type { ITaskTemplateRepository } from '@dailyuse/domain-server';
import { TaskTemplate } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';

/**
 * TaskTemplate Prisma 仓储实现
 * 负责 TaskTemplate 的持久化
 *
 * TODO: 当前 Prisma schema 与领域模型不完全匹配
 * 需要更新 schema.prisma 中的 TaskTemplate 模型以匹配新的领域设计
 *
 * 当前 schema 缺少以下字段：
 * - task_type (TaskType enum)
 * - time_config (JSON)
 * - recurrence_rule (JSON)
 * - reminder_config (JSON)
 * - goal_binding (JSON)
 * - folder_uuid
 * - color
 * - last_generated_date
 * - generate_ahead_days
 * - deleted_at
 *
 * 临时方案：使用现有字段进行映射
 */
export class PrismaTaskTemplateRepository implements ITaskTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将 Prisma 数据映射为 TaskTemplate 实体
   */
  private mapToEntity(data: any, includeChildren: boolean = false): TaskTemplate {
    // TODO: 需要更新映射逻辑以匹配新的领域模型
    // 当前使用简化映射
    const template = TaskTemplate.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.accountUuid,
      title: data.title,
      description: data.description,
      task_type: data.scheduleMode === 'once' ? 'ONE_TIME' : 'RECURRING',
      time_config: JSON.stringify({
        time_type: data.timeType,
        start_time: data.startTime,
        end_time: data.endTime,
        start_date: data.startDate.getTime(),
        end_date: data.endDate?.getTime() ?? null,
      }),
      recurrence_rule:
        data.scheduleMode !== 'once'
          ? JSON.stringify({
              frequency: data.scheduleMode.toUpperCase(),
              interval: data.intervalDays ?? 1,
              days_of_week: JSON.parse(data.weekdays),
              end_date: data.endDate?.getTime() ?? null,
              occurrences: null,
            })
          : null,
      reminder_config: data.reminderEnabled
        ? JSON.stringify({
            enabled: data.reminderEnabled,
            triggers: [
              {
                type: 'relative',
                minutes_before: data.reminderMinutesBefore,
                methods: JSON.parse(data.reminderMethods),
              },
            ],
          })
        : null,
      importance: data.importance as any,
      urgency: data.urgency as any,
      goal_binding: null, // TODO: 从 goalLinks 解析
      folder_uuid: null,
      tags: JSON.parse(data.tags),
      color: null,
      status: data.status,
      last_generated_date: data.lastInstanceDate?.getTime() ?? null,
      generate_ahead_days: 7,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
      deleted_at: null,
    });

    // TODO: 加载子实体（instances 和 history）

    return template;
  }

  /**
   * 将 TaskTemplate 实体映射为 Prisma 数据
   */
  private mapFromEntity(template: TaskTemplate): any {
    const dto = template.toPersistenceDTO();

    // TODO: 需要更新映射逻辑
    // 当前使用简化映射
    const timeConfig = JSON.parse(dto.time_config);
    const recurrenceRule = dto.recurrence_rule ? JSON.parse(dto.recurrence_rule) : null;
    const reminderConfig = dto.reminder_config ? JSON.parse(dto.reminder_config) : null;

    return {
      uuid: dto.uuid,
      accountUuid: dto.account_uuid,
      title: dto.title,
      description: dto.description,
      timeType: timeConfig.time_type || 'allDay',
      startTime: timeConfig.start_time,
      endTime: timeConfig.end_time,
      startDate: new Date(timeConfig.start_date),
      endDate: timeConfig.end_date ? new Date(timeConfig.end_date) : null,
      scheduleMode:
        dto.task_type === 'ONE_TIME' ? 'once' : recurrenceRule?.frequency?.toLowerCase() || 'daily',
      intervalDays: recurrenceRule?.interval ?? null,
      weekdays: recurrenceRule?.days_of_week ? JSON.stringify(recurrenceRule.days_of_week) : '[]',
      monthDays: '[]',
      timezone: 'UTC',
      reminderEnabled: reminderConfig?.enabled ?? false,
      reminderMinutesBefore: reminderConfig?.triggers?.[0]?.minutes_before ?? 15,
      reminderMethods: reminderConfig?.triggers?.[0]?.methods
        ? JSON.stringify(reminderConfig.triggers[0].methods)
        : '[]',
      importance: dto.importance,
      urgency: dto.urgency,
      location: null,
      tags: JSON.stringify(dto.tags),
      status: dto.status,
      totalInstances: 0,
      completedInstances: 0,
      completionRate: 0.0,
      lastInstanceDate: dto.last_generated_date ? new Date(dto.last_generated_date) : null,
      goalLinks: '[]', // TODO: 从 goal_binding 序列化
    };
  }

  // ===== 仓储方法实现 =====

  async save(template: TaskTemplate): Promise<void> {
    const data = this.mapFromEntity(template);

    await this.prisma.taskTemplate.upsert({
      where: { uuid: template.uuid },
      create: data,
      update: data,
    });
  }

  async findByUuid(uuid: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({
      where: { uuid },
    });

    return data ? this.mapToEntity(data, false) : null;
  }

  async findByUuidWithChildren(uuid: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({
      where: { uuid },
      include: {
        instances: true,
      },
    });

    return data ? this.mapToEntity(data, true) : null;
  }

  async findByAccount(accountUuid: string): Promise<TaskTemplate[]> {
    const dataList = await this.prisma.taskTemplate.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return dataList.map((data) => this.mapToEntity(data, false));
  }

  async findByStatus(
    accountUuid: string,
    status: TaskContracts.TaskTemplateStatus,
  ): Promise<TaskTemplate[]> {
    const dataList = await this.prisma.taskTemplate.findMany({
      where: {
        accountUuid,
        status,
      },
      orderBy: { createdAt: 'desc' },
    });

    return dataList.map((data) => this.mapToEntity(data, false));
  }

  async findActiveTemplates(accountUuid: string): Promise<TaskTemplate[]> {
    const dataList = await this.prisma.taskTemplate.findMany({
      where: {
        accountUuid,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    return dataList.map((data) => this.mapToEntity(data, false));
  }

  async findByFolder(folderUuid: string): Promise<TaskTemplate[]> {
    // TODO: 当前 schema 没有 folder_uuid 字段
    // 暂时返回空数组
    return [];
  }

  async findByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    // TODO: 需要解析 goalLinks JSON 字段
    const dataList = await this.prisma.taskTemplate.findMany({
      where: {
        goalLinks: {
          contains: goalUuid,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return dataList.map((data) => this.mapToEntity(data, false));
  }

  async findByTags(accountUuid: string, tags: string[]): Promise<TaskTemplate[]> {
    // TODO: 需要更复杂的 JSON 查询
    // 暂时使用简单的包含查询
    const dataList = await this.prisma.taskTemplate.findMany({
      where: {
        accountUuid,
        OR: tags.map((tag) => ({
          tags: {
            contains: tag,
          },
        })),
      },
      orderBy: { createdAt: 'desc' },
    });

    return dataList.map((data) => this.mapToEntity(data, false));
  }

  async findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]> {
    const targetDate = new Date(toDate);

    const dataList = await this.prisma.taskTemplate.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            lastInstanceDate: null,
          },
          {
            lastInstanceDate: {
              lt: targetDate,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return dataList.map((data) => this.mapToEntity(data, false));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskTemplate.delete({
      where: { uuid },
    });
  }

  async softDelete(uuid: string): Promise<void> {
    // TODO: 当前 schema 没有 deleted_at 字段
    // 暂时使用 status 字段
    await this.prisma.taskTemplate.update({
      where: { uuid },
      data: {
        status: 'DELETED',
      },
    });
  }

  async restore(uuid: string): Promise<void> {
    await this.prisma.taskTemplate.update({
      where: { uuid },
      data: {
        status: 'ACTIVE',
      },
    });
  }
}
