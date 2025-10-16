import type { PrismaClient, Goal as PrismaGoal } from '@prisma/client';
import type { IGoalRepository } from '@dailyuse/domain-server';
import { GoalAggregate as Goal } from '@dailyuse/domain-server';
import { GoalContracts } from '@dailyuse/contracts';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  private importanceMap: Record<GoalContracts.ImportanceLevel, number> = {
    [GoalContracts.ImportanceLevel.Vital]: 4,
    [GoalContracts.ImportanceLevel.Important]: 3,
    [GoalContracts.ImportanceLevel.Moderate]: 2,
    [GoalContracts.ImportanceLevel.Minor]: 1,
    [GoalContracts.ImportanceLevel.Trivial]: 0,
  };

  private reverseImportanceMap: Record<number, GoalContracts.ImportanceLevel> = {
    4: GoalContracts.ImportanceLevel.Vital,
    3: GoalContracts.ImportanceLevel.Important,
    2: GoalContracts.ImportanceLevel.Moderate,
    1: GoalContracts.ImportanceLevel.Minor,
    0: GoalContracts.ImportanceLevel.Trivial,
  };

  private urgencyMap: Record<GoalContracts.UrgencyLevel, number> = {
    [GoalContracts.UrgencyLevel.Critical]: 4,
    [GoalContracts.UrgencyLevel.High]: 3,
    [GoalContracts.UrgencyLevel.Medium]: 2,
    [GoalContracts.UrgencyLevel.Low]: 1,
    [GoalContracts.UrgencyLevel.None]: 0,
  };

  private reverseUrgencyMap: Record<number, GoalContracts.UrgencyLevel> = {
    4: GoalContracts.UrgencyLevel.Critical,
    3: GoalContracts.UrgencyLevel.High,
    2: GoalContracts.UrgencyLevel.Medium,
    1: GoalContracts.UrgencyLevel.Low,
    0: GoalContracts.UrgencyLevel.None,
  };

  private mapToEntity(data: PrismaGoal): Goal {
    return Goal.fromPersistenceDTO({
      uuid: data.uuid,
      account_uuid: data.account_uuid,
      title: data.title,
      description: data.description,
      status: data.status as GoalContracts.GoalStatus,
      importance: this.reverseImportanceMap[data.importance],
      urgency: this.reverseUrgencyMap[data.urgency],
      category: data.category,
      tags: data.tags ?? '[]',
      start_date: data.start_date ? data.start_date.getTime() : null,
      target_date: data.target_date ? data.target_date.getTime() : null,
      completed_at: data.completed_at ? data.completed_at.getTime() : null,
      archived_at: data.archived_at ? data.archived_at.getTime() : null,
      folder_uuid: data.folder_uuid,
      parent_goal_uuid: data.parent_goal_uuid,
      sort_order: data.sort_order,
      reminder_config: data.reminder_config,
      created_at: data.created_at.getTime(),
      updated_at: data.updated_at.getTime(),
      deleted_at: data.deleted_at ? data.deleted_at.getTime() : null,
    });
  }

  async save(goal: Goal): Promise<void> {
    const persistence = goal.toPersistenceDTO();
    const data = {
      title: persistence.title,
      description: persistence.description,
      status: persistence.status,
      importance: this.importanceMap[persistence.importance],
      urgency: this.urgencyMap[persistence.urgency],
      category: persistence.category,
      tags: persistence.tags,
      start_date: persistence.start_date ? new Date(persistence.start_date) : null,
      target_date: persistence.target_date ? new Date(persistence.target_date) : null,
      completed_at: persistence.completed_at ? new Date(persistence.completed_at) : null,
      archived_at: persistence.archived_at ? new Date(persistence.archived_at) : null,
      folder_uuid: persistence.folder_uuid,
      parent_goal_uuid: persistence.parent_goal_uuid,
      sort_order: persistence.sort_order,
      reminder_config: persistence.reminder_config,
      updated_at: new Date(persistence.updated_at),
      deleted_at: persistence.deleted_at ? new Date(persistence.deleted_at) : null,
    };

    await this.prisma.goal.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        account_uuid: persistence.account_uuid,
        created_at: new Date(persistence.created_at),
        ...data,
      },
      update: data,
    });
  }

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<Goal | null> {
    const data = await this.prisma.goal.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<Goal[]> {
    const where: any = { account_uuid: accountUuid, deleted_at: null };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.folderUuid) {
      where.folder_uuid = options.folderUuid;
    }
    const data = await this.prisma.goal.findMany({ where });
    return data.map((d) => this.mapToEntity(d));
  }

  async findByFolderUuid(folderUuid: string): Promise<Goal[]> {
    const data = await this.prisma.goal.findMany({
      where: { folder_uuid: folderUuid, deleted_at: null },
    });
    return data.map((d) => this.mapToEntity(d));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.goal.delete({ where: { uuid } });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.goal.update({
      where: { uuid },
      data: { deleted_at: new Date() },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.goal.count({ where: { uuid } });
    return count > 0;
  }

  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { status },
    });
  }

  async batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { folder_uuid: folderUuid },
    });
  }
}
