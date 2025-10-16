import { PrismaClient } from '@prisma/client';
import type { ITaskInstanceRepository } from '@dailyuse/domain-server';
import { TaskInstance } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';

type TaskInstanceStatus = TaskContracts.TaskInstanceStatus;

/**
 * TaskInstance Prisma Ө��
 * �UZ9�P�S
 * JSON W�time_config, completion_record, skip_record
 */
export class PrismaTaskInstanceRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any): TaskInstance {
    return TaskInstance.fromPersistenceDTO({
      uuid: data.uuid,
      template_uuid: data.templateUuid,
      account_uuid: data.accountUuid,
      instance_date: Number(data.instanceDate),
      time_config: data.timeConfig,
      status: data.status,
      completion_record: data.completionRecord,
      skip_record: data.skipRecord,
      actual_start_time: data.actualStartTime ? Number(data.actualStartTime) : null,
      actual_end_time: data.actualEndTime ? Number(data.actualEndTime) : null,
      note: data.note,
      created_at: Number(data.createdAt),
      updated_at: Number(data.updatedAt),
    });
  }

  async save(instance: TaskInstance): Promise<void> {
    const persistence = instance.toPersistenceDTO();

    const data = {
      uuid: persistence.uuid,
      templateUuid: persistence.template_uuid,
      accountUuid: persistence.account_uuid,
      instanceDate: BigInt(persistence.instance_date),
      timeConfig: persistence.time_config,
      status: persistence.status,
      completionRecord: persistence.completion_record,
      skipRecord: persistence.skip_record,
      actualStartTime: persistence.actual_start_time ? BigInt(persistence.actual_start_time) : null,
      actualEndTime: persistence.actual_end_time ? BigInt(persistence.actual_end_time) : null,
      note: persistence.note,
      createdAt: BigInt(persistence.created_at),
      updatedAt: BigInt(persistence.updated_at),
    };

    await this.prisma.taskInstance.upsert({
      where: { uuid: persistence.uuid },
      create: data,
      update: {
        ...data,
        uuid: undefined, // Cannot update uuid
        templateUuid: undefined,
        accountUuid: undefined,
        createdAt: undefined,
      },
    });
  }

  async saveMany(instances: TaskInstance[]): Promise<void> {
    // Use Prisma's createMany for efficiency if possible, but upsert logic requires looping.
    // For now, keeping the loop to respect the save logic.
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
    return instances.map(this.mapToEntity);
  }

  async findByAccount(accountUuid: string): Promise<TaskInstance[]> {
    const instances = await this.prisma.taskInstance.findMany({
      where: { accountUuid },
      orderBy: { instanceDate: 'desc' },
    });
    return instances.map(this.mapToEntity);
  }

  async findByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]> {
    const instances = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        instanceDate: {
          gte: BigInt(startDate),
          lte: BigInt(endDate),
        },
      },
      orderBy: { instanceDate: 'asc' },
    });
    return instances.map(this.mapToEntity);
  }

  async findByStatus(accountUuid: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const instances = await this.prisma.taskInstance.findMany({
      where: { accountUuid, status },
      orderBy: { instanceDate: 'desc' },
    });
    return instances.map(this.mapToEntity);
  }

  async findOverdueInstances(accountUuid: string): Promise<TaskInstance[]> {
    const oneDayAgo = BigInt(Date.now() - 86400000);
    const instances = await this.prisma.taskInstance.findMany({
      where: {
        accountUuid,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        instanceDate: { lt: oneDayAgo },
      },
      orderBy: { instanceDate: 'asc' },
    });
    return instances.map(this.mapToEntity);
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
