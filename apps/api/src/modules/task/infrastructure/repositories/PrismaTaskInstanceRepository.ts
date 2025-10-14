import { PrismaClient } from '@prisma/client';
import type { ITaskInstanceRepository } from '@dailyuse/domain-server';
import { TaskInstance } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';

/**
 * TaskInstance Prisma 仓储实现
 * 负责 TaskInstance 的持久化
 *
 * TODO: 当前 Prisma schema 与领域模型不完全匹配
 * 需要更新 schema.prisma 中的 TaskInstance 模型以匹配新的领域设计
 *
 * 当前 schema 缺少以下字段：
 * - completion_record (JSON)
 * - skip_record (JSON)
 * - time_config (JSON)
 *
 * 临时方案：使用现有字段进行映射
 */
export class PrismaTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将 Prisma 数据映射为 TaskInstance 实体
   */
  private mapToEntity(data: any): TaskInstance {
    // TODO: 需要更新映射逻辑以匹配新的领域模型
    // 当前使用简化映射
    return TaskInstance.fromPersistenceDTO({
      uuid: data.uuid,
      template_uuid: data.templateUuid,
      account_uuid: data.accountUuid,
      instance_date: data.scheduledDate.getTime(),
      time_config: JSON.stringify({
        time_type: data.timeType,
        start_time: data.startTime,
        end_time: data.endTime,
        start_date: data.scheduledDate.getTime(),
        end_date: null,
      }),
      status: data.executionStatus,
      completion_record: null,
      skip_record: null,
      actual_start_time: data.actualStartTime?.getTime() ?? null,
      actual_end_time: data.actualEndTime?.getTime() ?? null,
      note: data.executionNotes,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
    });
  }

  /**
   * 将 TaskInstance 实体映射为 Prisma 数据
   */
  private mapFromEntity(instance: TaskInstance): any {
    const dto = instance.toPersistenceDTO();

    // TODO: 需要更新映射逻辑
    // 当前使用简化映射
    return {
      uuid: dto.uuid,
      templateUuid: dto.template_uuid,
      accountUuid: dto.account_uuid,
      title: 'Task Instance', // TODO: 从 template 获取
      description: null,
      timeType: 'allDay', // TODO: 从 time_config 解析
      scheduledDate: new Date(dto.instance_date),
      startTime: null,
      endTime: null,
      estimatedDuration: null,
      timezone: 'UTC',
      reminderEnabled: false,
      reminderStatus: 'pending',
      executionStatus: dto.status,
      actualStartTime: dto.actual_start_time ? new Date(dto.actual_start_time) : null,
      actualEndTime: dto.actual_end_time ? new Date(dto.actual_end_time) : null,
      actualDuration: null,
      progressPercentage: 0,
      executionNotes: dto.note,
      importance: 'moderate',
      urgency: 'medium',
      tags: '[]',
      lifecycleEvents: '[]',
      goalLinks: '[]',
    };
  }

  // ===== 仓储方法实现 =====

  async save(instance: TaskInstance): Promise<void> {
    const data = this.mapFromEntity(instance);

    await this.prisma.taskInstance.upsert({
      where: { uuid: instance.uuid },
      create: data,
      update: data,
    });
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    // 使用事务批量保存
    await this.prisma.$transaction(
      instances.map((instance) => {
        const data = this.mapFromEntity(instance);
        return this.prisma.taskInstance.upsert({
          where: { uuid: instance.uuid },
          create: data,
          update: data,
        });
      }),
    );
  }

  async findByUuid(uuid: string): Promise<TaskInstance | null> {
    const data = await this.prisma.taskInstance.findUnique({
      where: { uuid },
    });

    return data ? this.mapToEntity(data) : null;
  }

  async findByTemplate(templateUuid: string): Promise<TaskInstance[]> {
    const dataList = await this.prisma.taskInstance.findMany({
      where: { templateUuid },
      orderBy: { scheduledDate: 'asc' },
    });

    return dataList.map((data) => this.mapToEntity(data));
  }

  async findByAccount(accountUuid: string): Promise<TaskInstance[]> {
    const dataList = await this.prisma.taskInstance.findMany({
      where: { accountUuid },
      orderBy: { scheduledDate: 'desc' },
    });

    return dataList.map((data) => this.mapToEntity(data));
  }

  async findByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const dataList = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        scheduledDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return dataList.map((data) => this.mapToEntity(data));
  }

  async findByStatus(
    accountUuid: string,
    status: TaskContracts.TaskInstanceStatus,
  ): Promise<TaskInstance[]> {
    const dataList = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        executionStatus: status,
      },
      orderBy: { scheduledDate: 'desc' },
    });

    return dataList.map((data) => this.mapToEntity(data));
  }

  async findOverdueInstances(accountUuid: string): Promise<TaskInstance[]> {
    const now = new Date();
    const dataList = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        executionStatus: 'PENDING',
        scheduledDate: {
          lt: now,
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return dataList.map((data) => this.mapToEntity(data));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskInstance.delete({
      where: { uuid },
    });
  }

  async deleteMany(uuids: string[]): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: {
        uuid: { in: uuids },
      },
    });
  }

  async deleteByTemplate(templateUuid: string): Promise<void> {
    await this.prisma.taskInstance.deleteMany({
      where: { templateUuid },
    });
  }
}
