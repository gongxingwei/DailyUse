import type { PrismaClient, Goal as PrismaGoal } from '@prisma/client';
import type { IGoalRepository } from '@dailyuse/domain-server';
import { GoalAggregate as Goal } from '@dailyuse/domain-server';
import { GoalContracts } from '@dailyuse/contracts';

// 类型别名（从命名空间导入）
type GoalStatus = GoalContracts.GoalStatus;
type ImportanceLevel = GoalContracts.ImportanceLevel;
type UrgencyLevel = GoalContracts.UrgencyLevel;

// 枚举值别名
const ImportanceLevel = GoalContracts.ImportanceLevel;
const UrgencyLevel = GoalContracts.UrgencyLevel;

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  private importanceMap: Record<ImportanceLevel, number> = {
    [ImportanceLevel.Vital]: 4,
    [ImportanceLevel.Important]: 3,
    [ImportanceLevel.Moderate]: 2,
    [ImportanceLevel.Minor]: 1,
    [ImportanceLevel.Trivial]: 0,
  };

  private reverseImportanceMap: Record<number, ImportanceLevel> = {
    4: ImportanceLevel.Vital,
    3: ImportanceLevel.Important,
    2: ImportanceLevel.Moderate,
    1: ImportanceLevel.Minor,
    0: ImportanceLevel.Trivial,
  };

  private urgencyMap: Record<UrgencyLevel, number> = {
    [UrgencyLevel.Critical]: 4,
    [UrgencyLevel.High]: 3,
    [UrgencyLevel.Medium]: 2,
    [UrgencyLevel.Low]: 1,
    [UrgencyLevel.None]: 0,
  };

  private reverseUrgencyMap: Record<number, UrgencyLevel> = {
    4: UrgencyLevel.Critical,
    3: UrgencyLevel.High,
    2: UrgencyLevel.Medium,
    1: UrgencyLevel.Low,
    0: UrgencyLevel.None,
  };

  /**
   * 将 Prisma 模型映射为领域实体
   * 注意：这里处理 snake_case (数据库) → camelCase (PersistenceDTO) 的映射
   */
  private mapToEntity(data: PrismaGoal): Goal {
    return Goal.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.account_uuid,
      title: data.title,
      description: data.description,
      status: data.status as GoalStatus,
      importance: this.reverseImportanceMap[data.importance],
      urgency: this.reverseUrgencyMap[data.urgency],
      category: data.category,
      tags: data.tags ?? '[]',
      startDate: data.start_date ? data.start_date.getTime() : null,
      targetDate: data.target_date ? data.target_date.getTime() : null,
      completedAt: data.completed_at ? data.completed_at.getTime() : null,
      archivedAt: data.archived_at ? data.archived_at.getTime() : null,
      folderUuid: data.folder_uuid,
      parentGoalUuid: data.parent_goal_uuid,
      sortOrder: data.sort_order,
      reminderConfig: data.reminder_config,
      createdAt: data.created_at.getTime(),
      updatedAt: data.updated_at.getTime(),
      deletedAt: data.deleted_at ? data.deleted_at.getTime() : null,
    });
  }

  /**
   * 保存领域实体到数据库
   * 注意：这里处理 camelCase (PersistenceDTO) → snake_case (数据库) 的映射
   */
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
      start_date: persistence.startDate ? new Date(persistence.startDate) : null,
      target_date: persistence.targetDate ? new Date(persistence.targetDate) : null,
      completed_at: persistence.completedAt ? new Date(persistence.completedAt) : null,
      archived_at: persistence.archivedAt ? new Date(persistence.archivedAt) : null,
      folder_uuid: persistence.folderUuid,
      parent_goal_uuid: persistence.parentGoalUuid,
      sort_order: persistence.sortOrder,
      reminder_config: persistence.reminderConfig,
      updated_at: new Date(persistence.updatedAt),
      deleted_at: persistence.deletedAt ? new Date(persistence.deletedAt) : null,
    };

    await this.prisma.goal.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        account_uuid: persistence.accountUuid,
        created_at: new Date(persistence.createdAt),
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
