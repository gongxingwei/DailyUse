import type { ApiResponse } from '@dailyuse/contracts';
import type { IGoal, IGoalDir, IGoalReview } from '@common/modules/goal/types/goal';
import { goalIpcClient } from '../../infrastructure/ipc/goalIpcClient';
import { GoalDir } from '../../domain/aggregates/goalDir';
import { useGoalStore } from '../../presentation/stores/goalStore';
import { Goal } from '../../domain/aggregates/goal';
import { GoalRecord } from '../../domain/entities/record';
import { GoalReview } from '../../domain/entities/goalReview';
/**
 * 目标领域应用服务
 * 协调 IPC 通信和状态管理，提供统一的业务接口
 *
 * 职责：
 * 1. 调用 IPC 客户端与主进程通信
 * 2. 同步数据到前端状态仓库
 * 3. 处理错误和异常情况
 * 4. 提供统一的业务接口
 */
export class GoalDomainApplicationService {
  private get goalStore() {
    return useGoalStore();
  }

  use() {
    // 防止未使用警告，后续会用到
    void this.syncGoalsToState;
    void this.syncGoalDirsToState;
  }

  // ========== 目标管理 ==========

  /**
   * 创建目标
   */
  async createGoal(goal: Goal): Promise<ApiResponse<Goal>> {
    try {
      console.log('🔄 [目标应用服务] 创建目标:', goal.name);

      // 调用主进程创建目标
      const response = await goalIpcClient.createGoal(goal);

      if (response.success && response.data) {
        const goalDTO = response.data;
        const createdGoal = Goal.fromDTO(goalDTO);
        // 同步到前端状态
        await this.syncGoalToState(createdGoal);

        console.log('✅ [目标应用服务] 目标创建并同步成功:', createdGoal.uuid);
        return {
          success: true,
          message: response.message,
          data: createdGoal,
        };
      }

      console.error('❌ [目标应用服务] 目标创建失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 创建目标异常:', error);
      return {
        success: false,
        message: `创建目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有目标
   */
  async getAllGoals(): Promise<Goal[]> {
    try {
      console.log('🔄 [目标应用服务] 获取所有目标');

      const response = await goalIpcClient.getAllGoals();

      if (response.success && response.data) {
        const goalDTOs = response.data;
        const goals: Goal[] = goalDTOs.map((dto) => Goal.fromDTO(dto));
        return goals;
      }

      console.error('❌ [目标应用服务] 获取目标失败:', response.message);
      return [];
    } catch (error) {
      console.error('❌ [目标应用服务] 获取目标异常:', error);
      return [];
    }
  }

  /**
   * 根据ID获取目标
   */
  async getGoalById(goalUuid: string): Promise<IGoal | null> {
    try {
      console.log('🔄 [目标应用服务] 获取目标:', goalUuid);

      const response = await goalIpcClient.getGoalById(goalUuid);

      if (response.success && response.data) {
        console.log('✅ [目标应用服务] 获取目标成功:', goalUuid);
        return response.data;
      }

      console.error('❌ [目标应用服务] 获取目标失败:', response.message);
      return null;
    } catch (error) {
      console.error('❌ [目标应用服务] 获取目标异常:', error);
      return null;
    }
  }

  /**
   * 更新目标
   */
  async updateGoal(goal: IGoal): Promise<ApiResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 更新目标:', goal.uuid);

      // 调用主进程更新目标
      const response = await goalIpcClient.updateGoal(goal);

      if (response.success && response.data) {
        const goalDTO = response.data;
        const updatedGoal = Goal.fromDTO(goalDTO);
        // 同步到前端状态
        await this.syncGoalToState(updatedGoal);
        console.log('✅ [目标应用服务] 目标更新并同步成功:', updatedGoal.uuid);
        return {
          success: true,
          message: response.message,
          data: { goal: updatedGoal },
        };
      }

      console.error('❌ [目标应用服务] 目标更新失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 更新目标异常:', error);
      return {
        success: false,
        message: `更新目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(goalUuid: string): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 [目标应用服务] 删除目标:', goalUuid);

      // 调用主进程删除目标
      const response = await goalIpcClient.deleteGoal(goalUuid);

      if (response.success) {
        // 从前端状态移除
        this.goalStore.removeGoal(goalUuid);

        console.log('✅ [目标应用服务] 目标删除并同步成功:', goalUuid);
        return {
          success: true,
          message: response.message,
        };
      }

      console.error('❌ [目标应用服务] 目标删除失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 删除目标异常:', error);
      return {
        success: false,
        message: `删除目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除所有目标
   */
  async deleteAllGoals(): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 [目标应用服务] 删除所有目标');

      // 调用主进程删除所有目标
      const response = await goalIpcClient.deleteAllGoals();

      if (response.success) {
        // 清空前端状态
        this.goalStore.goals = [];

        console.log('✅ [目标应用服务] 所有目标删除并同步成功');
        return {
          success: true,
          message: response.message,
        };
      }

      console.error('❌ [目标应用服务] 删除所有目标失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 删除所有目标异常:', error);
      return {
        success: false,
        message: `删除所有目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 记录管理（聚合根驱动）==========

  async addGoalRecordToGoal(record: GoalRecord): Promise<ApiResponse<Goal>> {
    try {
      // 调用主进程的聚合根方法
      const response = await goalIpcClient.addGoalRecordToGoal(record);

      if (response.success && response.data) {
        const { goalDTO } = response.data;
        console.log('✅ [目标应用服务] 记录添加成功,返回的 GoalDTO 数据:', goalDTO);
        const goal = Goal.fromDTO(goalDTO);
        // 同步目标到前端状态（包含新记录）
        await this.syncGoalToState(goal);

        return {
          success: true,
          message: response.message,
          data: goal,
        };
      }

      console.error('❌ [目标应用服务] 记录添加失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 添加记录异常:', error);
      return {
        success: false,
        message: `添加记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async removeGoalRecordFromGoal(record: GoalRecord): Promise<ApiResponse<{ goal: IGoal }>> {
    try {
      // 调用主进程的聚合根方法
      const response = await goalIpcClient.removeGoalRecordFromGoal(record);

      if (response.success && response.data) {
        const goal = Goal.fromDTO(response.data.goal);
        // 同步目标到前端状态
        await this.syncGoalToState(goal);

        console.log('✅ [目标应用服务] 记录删除并同步成功:', record.uuid);
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      console.error('❌ [目标应用服务] 记录删除失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 删除记录异常:', error);
      return {
        success: false,
        message: `删除记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 目标复盘管理（聚合根驱动）==========

  async addReviewToGoal(goalReview: GoalReview): Promise<ApiResponse<Goal>> {
    try {
      console.log('🔄 [目标应用服务] 为目标添加复盘:', goalReview);

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.addReviewToGoal(goalReview);

      if (response.success && response.data) {
        const goalDTO = response.data;
        const goal = Goal.fromDTO(goalDTO);
        // 同步目标到前端状态（包含新复盘）
        await this.syncGoalToState(goal);

        return {
          success: true,
          message: response.message,
          data: goal,
        };
      }

      console.error('❌ [目标应用服务] 复盘添加失败:', response.message);
      return {
        success: false,
        message: response.message || '添加复盘失败',
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 添加复盘异常:', error);
      return {
        success: false,
        message: `添加复盘失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async updateReviewInGoal(goalReview: GoalReview): Promise<ApiResponse<Goal>> {
    try {
      // 调用主进程的聚合根方法
      const response = await goalIpcClient.updateReviewInGoal(goalReview);

      if (response.success && response.data) {
        const goalDTO = response.data;
        const goal = Goal.fromDTO(goalDTO);
        await this.syncGoalToState(goal);

        return {
          success: true,
          message: response.message,
          data: goal,
        };
      }

      console.error('❌ [目标应用服务] 复盘更新失败:', response.message);
      return {
        success: false,
        message: response.message || '更新复盘失败',
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 更新复盘异常:', error);
      return {
        success: false,
        message: `更新复盘失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async removeReviewFromGoal(goalReview: GoalReview): Promise<ApiResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 从目标移除复盘:', goalReview);

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.removeReviewFromGoal(goalReview);

      if (response.success && response.data) {
        const { goal: goalDTO } = response.data;
        const goal = Goal.fromDTO(goalDTO);
        // 同步目标到前端状态（移除复盘后）
        await this.syncGoalToState(goal);

        console.log('✅ [目标应用服务] 复盘移除并同步成功');
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      console.error('❌ [目标应用服务] 复盘移除失败:', response.message);
      return {
        success: false,
        message: response.message || '移除复盘失败',
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 移除复盘异常:', error);
      return {
        success: false,
        message: `移除复盘失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async getGoalReviews(goalUuid: string): Promise<IGoalReview[]> {
    try {
      console.log('🔄 [目标应用服务] 获取目标复盘:', goalUuid);

      // 调用主进程获取目标复盘
      const response = await goalIpcClient.getGoalReviews(goalUuid);

      if (response.success && response.data) {
        console.log('✅ [目标应用服务] 获取目标复盘成功:', response.data.length);
        return response.data;
      }

      console.error('❌ [目标应用服务] 获取目标复盘失败:', response.message);
      return [];
    } catch (error) {
      console.error('❌ [目标应用服务] 获取目标复盘异常:', error);
      return [];
    }
  }

  // ========== 目标目录管理 ==========

  async createGoalDir(goalDir: GoalDir): Promise<ApiResponse<{ goalDir: GoalDir }>> {
    try {
      console.log('🔍 [目标应用服务] 目录创建数据:', goalDir);
      // 调用主进程创建目标目录
      const response = await goalIpcClient.createGoalDir(goalDir);

      if (response.success && response.data) {
        const goalDirDTO = response.data;
        const goalDir = GoalDir.fromDTO(goalDirDTO);
        // 同步到前端状态
        await this.syncGoalDirToState(goalDir);

        return {
          success: true,
          message: response.message,
          data: { goalDir },
        };
      }
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 创建目标目录异常:', error);
      return {
        success: false,
        message: `创建目标目录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async getAllGoalDirs(): Promise<GoalDir[]> {
    try {
      console.log('🔄 [目标应用服务] 获取所有目标目录');

      const response = await goalIpcClient.getAllGoalDirs();

      if (response.success && response.data) {
        const goalDirDTOs = response.data;
        const goalDirs: GoalDir[] = goalDirDTOs.map((dto) => GoalDir.fromDTO(dto));
        console.log(`✅ [目标应用服务] 获取目标目录成功，数量: ${response.data.length}`);
        return goalDirs;
      }

      console.error('❌ [目标应用服务] 获取目标目录失败:', response.message);
      return [];
    } catch (error) {
      console.error('❌ [目标应用服务] 获取目标目录异常:', error);
      return [];
    }
  }

  async deleteGoalDir(goalDirId: string): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 [目标应用服务] 删除目标目录:', goalDirId);

      // 调用主进程删除目标目录
      const response = await goalIpcClient.deleteGoalDir(goalDirId);

      if (response.success) {
        // 从前端状态移除
        this.goalStore.removeGoalDir(goalDirId);

        console.log('✅ [目标应用服务] 目标目录删除并同步成功:', goalDirId);
        return {
          success: true,
          message: response.message,
        };
      }

      console.error('❌ [目标应用服务] 目标目录删除失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 删除目标目录异常:', error);
      return {
        success: false,
        message: `删除目标目录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async updateGoalDir(goalDir: GoalDir): Promise<ApiResponse<{ goalDir: IGoalDir }>> {
    try {
      console.log('🔄 [目标应用服务] 更新目标目录:', goalDir.name);

      // 调用主进程更新目标目录
      const response = await goalIpcClient.updateGoalDir(goalDir);

      if (response.success && response.data) {
        const goalDirDTO = response.data;
        const updatedGoalDir = GoalDir.fromDTO(goalDirDTO);
        // 同步到前端状态
        await this.syncGoalDirToState(updatedGoalDir);

        console.log('✅ [目标应用服务] 目标目录更新并同步成功:', goalDir.name);
        return {
          success: true,
          message: response.message,
          data: { goalDir: response.data },
        };
      }

      console.error('❌ [目标应用服务] 目标目录更新失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 更新目标目录异常:', error);
      return {
        success: false,
        message: `更新目标目录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 数据同步 ==========

  async syncAllData(): Promise<void> {
    try {
      console.log('🔄 [目标应用服务] 开始同步所有目标数据');

      // 获取所有数据
      const [goals, goalDirs] = await Promise.all([this.getAllGoals(), this.getAllGoalDirs()]);

      // 同步到状态仓库
      await this.syncAllGoalData(goals, goalDirs);

      console.log('✅ [目标应用服务] 所有目标数据同步完成');
    } catch (error) {
      console.error('❌ [目标应用服务] 同步所有数据失败:', error);
    }
  }

  // ========== 私有方法：状态同步 ==========

  private async syncGoalToState(goal: Goal): Promise<void> {
    try {
      await this.goalStore.syncGoalState(goal);
    } catch (error) {
      console.warn('⚠️ 同步目标到状态失败:', error);
    }
  }

  private async syncGoalsToState(goals: Goal[]): Promise<void> {
    try {
      await this.goalStore.syncGoalsState(goals);
    } catch (error) {
      console.warn('⚠️ 同步目标目录到状态失败:', error);
    }
  }

  private async syncGoalDirToState(goalDir: GoalDir): Promise<void> {
    try {
      console.log('[目标应用服务] 同步目标目录到状态:', goalDir);
      await this.goalStore.syncGoalDirState(goalDir);
    } catch (error) {
      console.warn('⚠️ 同步目标目录到状态失败:', error);
    }
  }

  private async syncGoalDirsToState(goalDirs: GoalDir[]): Promise<void> {
    try {
      console.log('[目标应用服务] 同步所有目标目录到状态');
      await this.goalStore.syncGoalDirsState(goalDirs);
    } catch (error) {
      console.warn('⚠️ 同步所有目标目录到状态失败:', error);
    }
  }

  private async syncAllGoalData(goals: Goal[], goalDirs: GoalDir[]): Promise<void> {
    try {
      console.log('[目标应用服务] 同步所有目标和目录到状态');
      await this.goalStore.$patch((state) => {
        state.goals = goals;
        state.goalDirs = goalDirs;
      });
    } catch (error) {
      console.warn('⚠️ 同步所有目标和目录到状态失败:', error);
    }
  }
}

// ========== 工厂方法 ==========

/**
 * 获取目标领域应用服务的默认实例
 */
let _goalDomainApplicationServiceInstance: GoalDomainApplicationService | null = null;

export function getGoalDomainApplicationService(): GoalDomainApplicationService {
  if (!_goalDomainApplicationServiceInstance) {
    _goalDomainApplicationServiceInstance = new GoalDomainApplicationService();
  }
  return _goalDomainApplicationServiceInstance;
}
