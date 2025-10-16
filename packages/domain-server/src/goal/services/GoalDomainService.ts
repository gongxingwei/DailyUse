import type { IGoalRepository } from '../repositories/IGoalRepository';
import { Goal } from '../aggregates/Goal';
import type { GoalContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

type GoalStatus = GoalContracts.GoalStatus;
type GoalReminderConfigServerDTO = GoalContracts.GoalReminderConfigServerDTO;
/**
 * Goal Domain Service
 *
 * 核心职责：
 * - 编排和协调 Goal 模块内的多个聚合根和实体。
 * - 处理跨聚合的复杂业务规则和不变量。
 * - 封装核心业务流程，供 Application Service 调用。
 */
export class GoalDomainService {
  constructor(private readonly goalRepository: IGoalRepository) {}

  public async createGoal(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    category?: string;
    tags?: string[];
    startDate?: number;
    targetDate?: number;
    folderUuid?: string;
    parentGoalUuid?: string;
    reminderConfig?: GoalReminderConfigServerDTO;
  }): Promise<Goal> {
    // 1. 可以在这里添加服务层面的验证，例如检查 parentGoalUuid 是否有效
    if (params.parentGoalUuid) {
      const parentGoal = await this.goalRepository.findById(params.parentGoalUuid);
      if (!parentGoal) {
        throw new Error(`Parent goal not found: ${params.parentGoalUuid}`);
      }
    }

    // 2. 创建聚合根
    const goal = Goal.create(params);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 触发领域事件 (如果需要)
    // this.eventBus.publish(goal.getDomainEvents());

    return goal;
  }

  public async getGoal(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Goal | null> {
    return this.goalRepository.findById(uuid, options);
  }

  public async getGoalsForAccount(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<Goal[]> {
    return this.goalRepository.findByAccountUuid(accountUuid, options);
  }

  public async updateGoalBasicInfo(
    uuid: string,
    params: {
      title?: string;
      description?: string;
      importance?: ImportanceLevel;
      urgency?: UrgencyLevel;
      category?: string;
    },
  ): Promise<Goal> {
    const goal = await this.getGoal(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.updateBasicInfo(params);
    await this.goalRepository.save(goal);
    return goal;
  }

  public async changeGoalStatus(uuid: string, newStatus: GoalStatus): Promise<Goal> {
    const goal = await this.getGoal(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.updateStatus(newStatus);
    await this.goalRepository.save(goal);
    return goal;
  }

  public async completeGoal(uuid: string): Promise<Goal> {
    const goal = await this.getGoal(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.complete();
    await this.goalRepository.save(goal);
    return goal;
  }

  public async archiveGoal(uuid: string): Promise<Goal> {
    const goal = await this.getGoal(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.archive();
    await this.goalRepository.save(goal);
    return goal;
  }

  public async deleteGoal(uuid: string, softDelete: boolean = true): Promise<void> {
    const goal = await this.getGoal(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    if (softDelete) {
      await this.goalRepository.softDelete(uuid);
    } else {
      await this.goalRepository.delete(uuid);
    }
  }

  public async addKeyResultToGoal(
    goalUuid: string,
    params: {
      title: string;
      description?: string;
      valueType: string;
      targetValue: number;
      unit?: string;
      weight: number;
    },
  ): Promise<Goal> {
    const goal = await this.getGoal(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    const keyResult = goal.createKeyResult(params);
    goal.addKeyResult(keyResult);

    await this.goalRepository.save(goal);
    return goal;
  }

  public async updateKeyResultProgress(
    goalUuid: string,
    keyResultUuid: string,
    currentValue: number,
    note?: string,
  ): Promise<Goal> {
    const goal = await this.getGoal(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }
    goal.updateKeyResultProgress(keyResultUuid, currentValue, note);
    await this.goalRepository.save(goal);
    return goal;
  }

  public async addReviewToGoal(
    goalUuid: string,
    params: {
      title: string;
      content: string;
      reviewType: string;
      rating?: number;
      achievements?: string;
      challenges?: string;
      nextActions?: string;
    },
  ): Promise<Goal> {
    const goal = await this.getGoal(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    const review = goal.createReview(params);
    goal.addReview(review);

    await this.goalRepository.save(goal);
    return goal;
  }
}
