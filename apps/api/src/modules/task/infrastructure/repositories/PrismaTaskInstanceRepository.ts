import { PrismaClient } from '@prisma/client';
import type { ITaskInstanceRepository } from '@dailyuse/domain-server';
import { TaskInstance } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';

type TaskInstanceStatus = TaskContracts.TaskInstanceStatus;

/**
 * TaskInstance Prisma ”®û∞
 * ÄUZ9‡PûS
 * JSON Wµtime_config, completion_record, skip_record
 */
export class PrismaTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): TaskInstance {
    return TaskInstance.fromPersistenceDTO({
      uuid: data.uuid,
      template_uuid: data.templateUuid,
      account_uuid: data.accountUuid,
      instance_date: data.instanceDate.getTime(),
      time_config: data.timeConfig,
      status: data.status,
      completion_record: data.completionRecord,
      skip_record: data.skipRecord,
      actual_start_time: data.actualStartTime?.getTime() ?? null,
      actual_end_time: data.actualEndTime?.getTime() ?? null,
      note: data.note,
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
    });
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(instance: TaskInstance): Promise<void> {
    const persistence = instance.toPersistenceDTO();

    await this.prisma.taskInstance.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        templateUuid: persistence.template_uuid,
        accountUuid: persistence.account_uuid,
        instanceDate: this.toDate(persistence.instance_date) ?? new Date(),
        timeConfig: persistence.time_config,
        status: persistence.status,
        completionRecord: persistence.completion_record,
        skipRecord: persistence.skip_record,
        actualStartTime: this.toDate(persistence.actual_start_time),
        actualEndTime: this.toDate(persistence.actual_end_time),
        note: persistence.note,
        createdAt: this.toDate(persistence.created_at) ?? new Date(),
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
      },
      update: {
        timeConfig: persistence.time_config,
        status: persistence.status,
        completionRecord: persistence.completion_record,
        skipRecord: persistence.skip_record,
        actualStartTime: this.toDate(persistence.actual_start_time),
        actualEndTime: this.toDate(persistence.actual_end_time),
        note: persistence.note,
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
      },
    });
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    for (const instance of instances) {
      await this.save(instance);
    }
  }

  async findByUuid(uuid: string): Promise<TaskInstance | null> {
    const data = await this.prisma.taskInstance.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByTemplate(templateUuid: string): Promise<TaskInstance[]> {
    const instances = await this.prisma.taskInstance.findMany({
      where: { templateUuid },
      orderBy: { instanceDate: 'desc' },
    });
    return instances.map((i) => this.mapToEntity(i));
  }

  async findByAccount(accountUuid: string): Promise<TaskInstance[]> {
    const instances = await this.prisma.taskInstance.findMany({
      where: { accountUuid },
      orderBy: { instanceDate: 'desc' },
    });
    return instances.map((i) => this.mapToEntity(i));
  }

  async findByDateRange(accountUuid: string, startDate: number, endDate: number): Promise<TaskInstance[]> {
    const instances = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        instanceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { instanceDate: 'asc' },
    });
    return instances.map((i) => this.mapToEntity(i));
  }

  async findByStatus(accountUuid: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const instances = await this.prisma.taskInstance.findMany({
      where: { accountUuid, status },
      orderBy: { instanceDate: 'desc' },
    });
    return instances.map((i) => this.mapToEntity(i));
  }

  async findOverdueInstances(accountUuid: string): Promise<TaskInstance[]> {
    const oneDayAgo = new Date(Date.now() - 86400000);
    const instances = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        instanceDate: { lt: oneDayAgo },
      },
      orderBy: { instanceDate: 'asc' },
    });
    return instances.map((i) => this.mapToEntity(i));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskInstance.delete({ where: { uuid } });
  }

  async deleteMany(uuids: string[]): Promise<void> {
    await this.prisma.taskInstance.deleteMany({ where: { uuid: { in: uuids } } });
  }

  async deleteByTemplate(templateUuid: string): Promise<void> {
    await this.prisma.taskInstance.deleteMany({ where: { templateUuid } });
  }
}
