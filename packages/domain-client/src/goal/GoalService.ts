import { Goal, GoalDir } from './aggregates/Goal';
import { type GoalContracts } from '@dailyuse/contracts';

/**
 * 客户端 Goal 服务
 * 处理客户端特有的业务逻辑和状态管理
 */
export class GoalService {
  private goals = new Map<string, Goal>();
  private goalDirs = new Map<string, GoalDir>();

  // ===== Goal 管理 =====

  /**
   * 添加或更新目标
   */
  addOrUpdateGoal(goal: Goal): void {
    this.goals.set(goal.uuid, goal);
  }

  /**
   * 获取目标
   */
  getGoal(uuid: string): Goal | undefined {
    return this.goals.get(uuid);
  }

  /**
   * 获取所有目标
   */
  getAllGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  /**
   * 根据目录获取目标
   */
  getGoalsByDir(dirUuid?: string): Goal[] {
    return Array.from(this.goals.values()).filter((goal) => goal.dirUuid === dirUuid);
  }

  /**
   * 根据状态获取目标
   */
  getGoalsByStatus(status: 'active' | 'completed' | 'paused' | 'archived'): Goal[] {
    return Array.from(this.goals.values()).filter((goal) => goal.status === status);
  }

  /**
   * 删除目标
   */
  removeGoal(uuid: string): void {
    this.goals.delete(uuid);
  }

  /**
   * 清空所有目标
   */
  clearGoals(): void {
    this.goals.clear();
  }

  // ===== GoalDir 管理 =====

  /**
   * 添加或更新目录
   */
  addOrUpdateGoalDir(goalDir: GoalDir): void {
    this.goalDirs.set(goalDir.uuid, goalDir);
  }

  /**
   * 获取目录
   */
  getGoalDir(uuid: string): GoalDir | undefined {
    return this.goalDirs.get(uuid);
  }

  /**
   * 获取所有目录
   */
  getAllGoalDirs(): GoalDir[] {
    return Array.from(this.goalDirs.values());
  }

  /**
   * 根据父目录获取子目录
   */
  getGoalDirsByParent(parentUuid?: string): GoalDir[] {
    return Array.from(this.goalDirs.values()).filter((dir) => dir.parentUuid === parentUuid);
  }

  /**
   * 获取根目录
   */
  getRootGoalDirs(): GoalDir[] {
    return this.getGoalDirsByParent(undefined);
  }

  /**
   * 删除目录
   */
  removeGoalDir(uuid: string): void {
    this.goalDirs.delete(uuid);
  }

  /**
   * 清空所有目录
   */
  clearGoalDirs(): void {
    this.goalDirs.clear();
  }

  // ===== 业务逻辑方法 =====

  /**
   * 获取需要关注的目标
   */
  getGoalsNeedingAttention(): Goal[] {
    return Array.from(this.goals.values()).filter((goal) => goal.needsAttention());
  }

  /**
   * 获取即将截止的目标
   */
  getGoalsDueSoon(days: number = 7): Goal[] {
    return Array.from(this.goals.values()).filter((goal) => {
      return goal.status === 'active' && goal.daysRemaining <= days && goal.daysRemaining >= 0;
    });
  }

  /**
   * 获取已逾期的目标
   */
  getOverdueGoals(): Goal[] {
    return Array.from(this.goals.values()).filter((goal) => goal.isOverdue);
  }

  /**
   * 获取已暂停的目标
   */
  getPausedGoals(): Goal[] {
    return this.getGoalsByStatus('paused');
  }

  /**
   * 获取目标统计信息
   */
  getGoalStatistics(): {
    total: number;
    active: number;
    completed: number;
    paused: number;
    archived: number;
    overdue: number;
    dueSoon: number;
    needingAttention: number;
  } {
    const goals = Array.from(this.goals.values());

    return {
      total: goals.length,
      active: goals.filter((g) => g.status === 'active').length,
      completed: goals.filter((g) => g.status === 'completed').length,
      paused: goals.filter((g) => g.status === 'paused').length,
      archived: goals.filter((g) => g.status === 'archived').length,
      overdue: goals.filter((g) => g.isOverdue).length,
      dueSoon: this.getGoalsDueSoon().length,
      needingAttention: this.getGoalsNeedingAttention().length,
    };
  }

  /**
   * 获取目录统计信息
   */
  getGoalDirStatistics(): {
    total: number;
    active: number;
    archived: number;
    system: number;
    user: number;
  } {
    const dirs = Array.from(this.goalDirs.values());

    return {
      total: dirs.length,
      active: dirs.filter((d) => d.status === 'active').length,
      archived: dirs.filter((d) => d.status === 'archived').length,
      system: dirs.filter((d) => d.isSystemDir).length,
      user: dirs.filter((d) => !d.isSystemDir).length,
    };
  }

  /**
   * 构建目录树结构
   */
  buildGoalDirTree(): GoalDirTreeNode[] {
    const dirs = Array.from(this.goalDirs.values());
    const dirMap = new Map<string, GoalDirTreeNode>();

    // 创建节点映射
    dirs.forEach((dir) => {
      dirMap.set(dir.uuid, {
        dir,
        children: [],
        goals: this.getGoalsByDir(dir.uuid),
      });
    });

    // 构建树结构
    const roots: GoalDirTreeNode[] = [];

    dirs.forEach((dir) => {
      const node = dirMap.get(dir.uuid)!;

      if (dir.parentUuid && dirMap.has(dir.parentUuid)) {
        dirMap.get(dir.parentUuid)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * 搜索目标
   */
  searchGoals(query: string): Goal[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.goals.values()).filter((goal) => {
      return (
        goal.name.toLowerCase().includes(lowerQuery) ||
        (goal.description && goal.description.toLowerCase().includes(lowerQuery)) ||
        (goal.note && goal.note.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * 搜索目录
   */
  searchGoalDirs(query: string): GoalDir[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.goalDirs.values()).filter((dir) => {
      return (
        dir.name.toLowerCase().includes(lowerQuery) ||
        (dir.description && dir.description.toLowerCase().includes(lowerQuery))
      );
    });
  }

  // ===== 缓存管理 =====

  /**
   * 从响应数据批量更新目标
   */
  updateGoalsFromResponses(responses: GoalContracts.GoalResponse[]): void {
    responses.forEach((response) => {
      const goal = Goal.fromResponse(response);
      this.addOrUpdateGoal(goal);
    });
  }

  /**
   * 从响应数据批量更新目录
   */
  updateGoalDirsFromResponses(responses: GoalContracts.GoalDirResponse[]): void {
    responses.forEach((response) => {
      const goalDir = GoalDir.fromResponse(response);
      this.addOrUpdateGoalDir(goalDir);
    });
  }

  /**
   * 检查是否需要刷新缓存
   */
  shouldRefreshCache(): boolean {
    const goals = Array.from(this.goals.values());
    return goals.some((goal) => goal.shouldRefresh());
  }

  /**
   * 获取本地存储键
   */
  getStorageKey(type: 'goals' | 'goalDirs'): string {
    return `dailyuse_${type}_cache`;
  }

  /**
   * 保存到本地存储
   */
  saveToLocalStorage(): void {
    try {
      const goalsData = Array.from(this.goals.values()).map((goal) => ({
        uuid: goal.uuid,
        name: goal.name,
        description: goal.description,
        color: goal.color,
        dirUuid: goal.dirUuid,
        startTime: goal.startTime.toISOString(),
        endTime: goal.endTime.toISOString(),
        note: goal.note,
        analysis: {
          motive: goal.analysis.motive,
          feasibility: goal.analysis.feasibility,
        },
        lifecycle: {
          status: goal.status,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
        },
        version: goal.version,
      }));

      const goalDirsData = Array.from(this.goalDirs.values()).map((dir) => ({
        uuid: dir.uuid,
        name: dir.name,
        description: dir.description,
        icon: dir.icon,
        color: dir.color,
        parentUuid: dir.parentUuid,
        sortConfig: dir.sortConfig,
        lifecycle: {
          status: dir.status,
          createdAt: dir.createdAt.toISOString(),
          updatedAt: dir.updatedAt.toISOString(),
        },
      }));

      localStorage.setItem(this.getStorageKey('goals'), JSON.stringify(goalsData));
      localStorage.setItem(this.getStorageKey('goalDirs'), JSON.stringify(goalDirsData));
    } catch (error) {
      console.warn('Failed to save goal data to localStorage:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromLocalStorage(): void {
    try {
      const goalsData = localStorage.getItem(this.getStorageKey('goals'));
      const goalDirsData = localStorage.getItem(this.getStorageKey('goalDirs'));

      if (goalsData) {
        const goals = JSON.parse(goalsData);
        goals.forEach((goalData: any) => {
          const goal = Goal.fromDTO(goalData);
          this.addOrUpdateGoal(goal);
        });
      }

      if (goalDirsData) {
        const goalDirs = JSON.parse(goalDirsData);
        goalDirs.forEach((dirData: any) => {
          const goalDir = GoalDir.fromDTO(dirData);
          this.addOrUpdateGoalDir(goalDir);
        });
      }
    } catch (error) {
      console.warn('Failed to load goal data from localStorage:', error);
    }
  }

  /**
   * 清空本地存储
   */
  clearLocalStorage(): void {
    localStorage.removeItem(this.getStorageKey('goals'));
    localStorage.removeItem(this.getStorageKey('goalDirs'));
  }
}

/**
 * 目录树节点
 */
export interface GoalDirTreeNode {
  dir: GoalDir;
  children: GoalDirTreeNode[];
  goals: Goal[];
}

// 导出单例实例
export const goalService = new GoalService();
