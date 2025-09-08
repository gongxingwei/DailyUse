import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, GoalDir } from '@dailyuse/domain-client';
import { goalApiClient, goalDirApiClient } from '../../infrastructure/api/goalApiClient';
import { useGoalStore } from '../../presentation/stores/goalStore';

/**
 * Goal Web 应用服务
 * 负责协调 Web 端的目标相关操作，整合 API 调用和本地状态管理
 */
export class GoalWebApplicationService {
  /**
   * 懒加载获取 Goal Store
   * 避免在 Pinia 初始化之前调用
   */
  private get goalStore() {
    return useGoalStore();
  }

  // ===== Goal CRUD 操作 =====

  async createGoal(request: GoalContracts.CreateGoalRequest): Promise<GoalContracts.GoalResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.createGoal(request);

      // 创建客户端实体并同步到 store
      const goal = Goal.fromResponse(response);
      this.goalStore.syncGoal(goal);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async getGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<GoalContracts.GoalListResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.getGoals(params);

      // 批量创建客户端实体并同步到 store
      const goals = response.goals.map((goalData) => Goal.fromDTO(goalData));
      this.goalStore.syncGoals(goals);

      // 更新分页信息
      if (response.page) {
        this.goalStore.setPagination({
          page: response.page,
          limit: response.limit,
          total: response.total,
        });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标列表失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async getGoalById(uuid: string): Promise<GoalContracts.GoalResponse | null> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.getGoalById(uuid);

      // 创建客户端实体并同步到 store
      const goal = Goal.fromResponse(response);
      this.goalStore.syncGoal(goal);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标详情失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async updateGoal(
    uuid: string,
    request: GoalContracts.UpdateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.updateGoal(uuid, request);

      // 更新客户端实体并同步到 store
      const goal = Goal.fromResponse(response);
      this.goalStore.syncGoal(goal);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async deleteGoal(uuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalApiClient.deleteGoal(uuid);

      // 从 store 中移除
      this.goalStore.removeGoal(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== Goal 状态管理 =====

  async activateGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.activateGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = Goal.fromResponse(response);
      this.goalStore.syncGoal(goal);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async pauseGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.pauseGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = Goal.fromResponse(response);
      this.goalStore.syncGoal(goal);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async completeGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.completeGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = Goal.fromResponse(response);
      this.goalStore.syncGoal(goal);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async archiveGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.archiveGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = Goal.fromResponse(response);
      this.goalStore.syncGoal(goal);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '归档目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== GoalDir 管理 =====

  async createGoalDir(
    request: GoalContracts.CreateGoalDirRequest,
  ): Promise<GoalContracts.GoalDirResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalDirApiClient.createGoalDir(request);

      // 创建客户端实体并同步到 store
      const goalDir = GoalDir.fromResponse(response);
      this.goalStore.syncGoalDir(goalDir);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建目标目录失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async getGoalDirs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string;
  }): Promise<GoalContracts.GoalDirListResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalDirApiClient.getGoalDirs(params);

      // 批量创建客户端实体并同步到 store
      const goalDirs = response.goalDirs.map((dirData) => GoalDir.fromDTO(dirData));
      this.goalStore.syncGoalDirs(goalDirs);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标目录列表失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async updateGoalDir(
    uuid: string,
    request: GoalContracts.UpdateGoalDirRequest,
  ): Promise<GoalContracts.GoalDirResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalDirApiClient.updateGoalDir(uuid, request);

      // 更新客户端实体并同步到 store
      const goalDir = GoalDir.fromResponse(response);
      this.goalStore.syncGoalDir(goalDir);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新目标目录失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async deleteGoalDir(uuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalDirApiClient.deleteGoalDir(uuid);

      // 从 store 中移除
      this.goalStore.removeGoalDir(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除目标目录失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 搜索和查询 =====

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<GoalContracts.GoalListResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.searchGoals(params);

      // 搜索结果不自动同步到 store，只返回结果
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 批量操作 =====

  async refreshGoals(): Promise<void> {
    await this.getGoals();
  }

  async refreshGoalDirs(): Promise<void> {
    await this.getGoalDirs();
  }

  async refreshAll(): Promise<void> {
    await Promise.all([this.refreshGoals(), this.refreshGoalDirs()]);
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有目标数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllGoals(): Promise<{
    goalsCount: number;
    goalDirsCount: number;
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // 并行获取所有目标和目录数据
      const [goalsResponse, goalDirsResponse] = await Promise.all([
        goalApiClient.getGoals({ limit: 1000 }), // 获取所有目标，设置较大的 limit
        goalDirApiClient.getGoalDirs({ limit: 1000 }), // 获取所有目录
      ]);

      // 转换为客户端实体
      const goals = goalsResponse.goals.map((goalData) => Goal.fromDTO(goalData));
      const goalDirs = goalDirsResponse.goalDirs.map((dirData) => GoalDir.fromDTO(dirData));

      // 批量同步到 store
      this.goalStore.syncGoals(goals);
      this.goalStore.syncGoalDirs(goalDirs);

      // 更新分页信息（如果有）
      if (goalsResponse.page) {
        this.goalStore.setPagination({
          page: goalsResponse.page,
          limit: goalsResponse.limit,
          total: goalsResponse.total,
        });
      }

      console.log(`成功同步数据: ${goals.length} 个目标, ${goalDirs.length} 个目录`);

      return {
        goalsCount: goals.length,
        goalDirsCount: goalDirs.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有目标数据失败';
      this.goalStore.setError(errorMessage);
      console.error('同步所有目标数据失败:', error);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 增量同步数据
   * 只同步在指定时间之后更新的数据
   */
  async syncIncrementalData(lastSyncTime?: Date): Promise<{
    goalsCount: number;
    goalDirsCount: number;
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const params = lastSyncTime
        ? {
            limit: 1000,
            updatedAfter: lastSyncTime.toISOString(),
          }
        : { limit: 1000 };

      // 并行获取更新的数据
      const [goalsResponse, goalDirsResponse] = await Promise.all([
        goalApiClient.getGoals(params),
        goalDirApiClient.getGoalDirs(params),
      ]);

      // 转换为客户端实体
      const goals = goalsResponse.goals.map((goalData) => Goal.fromDTO(goalData));
      const goalDirs = goalDirsResponse.goalDirs.map((dirData) => GoalDir.fromDTO(dirData));

      // 逐个同步到 store（保持现有数据）
      goals.forEach((goal) => this.goalStore.syncGoal(goal));
      goalDirs.forEach((goalDir) => this.goalStore.syncGoalDir(goalDir));

      console.log(`增量同步完成: ${goals.length} 个目标, ${goalDirs.length} 个目录`);

      return {
        goalsCount: goals.length,
        goalDirsCount: goalDirs.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '增量同步数据失败';
      this.goalStore.setError(errorMessage);
      console.error('增量同步数据失败:', error);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    return (
      !this.goalStore.isInitialized ||
      this.goalStore.getAllGoals.length === 0 ||
      this.goalStore.shouldRefreshCache()
    );
  }

  // ===== 工具方法 =====

  /**
   * 获取 Goal Store 实例
   */
  getStore() {
    return this.goalStore;
  }

  /**
   * 初始化服务
   * 会自动同步所有目标和目录数据到 store
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      await this.goalStore.initialize();

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('开始同步所有目标数据...');
        await this.syncAllGoals();
      } else {
        console.log('使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('Goal 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      if (!this.goalStore.isInitialized) {
        await this.goalStore.initialize();
      }
      throw error;
    }
  }

  /**
   * 仅初始化模块（不进行数据同步）
   * 用于应用启动时的基础模块初始化
   */
  async initializeModule(): Promise<void> {
    try {
      // 只初始化 store（加载本地缓存），不进行网络同步
      await this.goalStore.initialize();
      console.log('Goal 模块基础初始化完成（仅本地缓存）');
    } catch (error) {
      console.error('Goal 模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('强制重新同步所有数据...');
    await this.syncAllGoals();
  }
}
