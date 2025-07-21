import type { TResponse } from "@/shared/types/response";
import type { 
  IGoal, 
  IGoalCreateDTO, 
  IRecord, 
  IRecordCreateDTO, 
  IGoalDir, 
  IGoalReview,
  IGoalReviewCreateDTO 
} from "@common/modules/goal/types/goal";
import { goalIpcClient } from "../../infrastructure/ipc/goalIpcClient";
import { GoalDir } from "../../domain/entities/goalDir";
import { useGoalStore } from "../../presentation/stores/goalStore";

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

  // ========== 目标管理 ==========

  /**
   * 创建目标
   */
  async createGoal(goalData: IGoalCreateDTO): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 创建目标:', goalData.name);

      // 调用主进程创建目标
      const response = await goalIpcClient.createGoal(goalData);

      if (response.success && response.data) {
        // 同步到前端状态
        await this.syncGoalToState(response.data);

        console.log('✅ [目标应用服务] 目标创建并同步成功:', response.data.uuid);
        return {
          success: true,
          message: response.message,
          data: { goal: response.data },
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
  async getAllGoals(): Promise<IGoal[]> {
    try {
      console.log('🔄 [目标应用服务] 获取所有目标');

      const response = await goalIpcClient.getAllGoals();

      if (response.success && response.data) {
        console.log(`✅ [目标应用服务] 获取目标成功，数量: ${response.data.length}`);
        return response.data;
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
  async updateGoal(goalData: IGoal): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 更新目标:', goalData.uuid);

      // 调用主进程更新目标
      const response = await goalIpcClient.updateGoal(goalData);

      if (response.success && response.data) {
        // 同步到前端状态
        await this.syncGoalToState(response.data);

        console.log('✅ [目标应用服务] 目标更新并同步成功:', response.data.uuid);
        return {
          success: true,
          message: response.message,
          data: { goal: response.data },
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
  async deleteGoal(goalUuid: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [目标应用服务] 删除目标:', goalUuid);

      // 调用主进程删除目标
      const response = await goalIpcClient.deleteGoal(goalUuid);

      if (response.success) {
        // 从前端状态移除
        await this.removeGoalFromState(goalUuid);

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
  async deleteAllGoals(): Promise<TResponse<void>> {
    try {
      console.log('🔄 [目标应用服务] 删除所有目标');

      // 调用主进程删除所有目标
      const response = await goalIpcClient.deleteAllGoals();

      if (response.success) {
        // 清空前端状态
        await this.clearAllGoalsFromState();

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

  // ========== 关键结果管理（聚合根驱动）==========

  async addKeyResultToGoal(
    goalUuid: string,
    keyResultData: {
      name: string;
      startValue: number;
      targetValue: number;
      currentValue?: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
      weight?: number;
    }
  ): Promise<TResponse<{ goal: IGoal; keyResultId: string }>> {
    try {
      console.log('🔄 [目标应用服务] 为目标添加关键结果:', { goalUuid, ...keyResultData });

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.addKeyResultToGoal(goalUuid, keyResultData);

      if (response.success && response.data) {
        // 同步目标到前端状态
        await this.syncGoalToState(response.data.goal);

        console.log('✅ [目标应用服务] 关键结果添加并同步成功:', response.data.keyResultId);
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      console.error('❌ [目标应用服务] 关键结果添加失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 添加关键结果异常:', error);
      return {
        success: false,
        message: `添加关键结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async removeKeyResultFromGoal(goalUuid: string, keyResultId: string): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 删除目标关键结果:', { goalUuid, keyResultId });

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.removeKeyResultFromGoal(goalUuid, keyResultId);

      if (response.success && response.data) {
        // 同步目标到前端状态
        await this.syncGoalToState(response.data.goal);

        console.log('✅ [目标应用服务] 关键结果删除并同步成功:', keyResultId);
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      console.error('❌ [目标应用服务] 关键结果删除失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 删除关键结果异常:', error);
      return {
        success: false,
        message: `删除关键结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async updateKeyResultOfGoal(
    goalUuid: string,
    keyResultId: string,
    updates: {
      name?: string;
      targetValue?: number;
      weight?: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    }
  ): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 更新目标关键结果:', { goalUuid, keyResultId, updates });

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.updateKeyResultOfGoal(goalUuid, keyResultId, updates);

      if (response.success && response.data) {
        // 同步目标到前端状态
        await this.syncGoalToState(response.data.goal);

        console.log('✅ [目标应用服务] 关键结果更新并同步成功:', keyResultId);
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      console.error('❌ [目标应用服务] 关键结果更新失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 更新关键结果异常:', error);
      return {
        success: false,
        message: `更新关键结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async updateKeyResultCurrentValue(
    goalUuid: string, 
    keyResultId: string, 
    currentValue: number
  ): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 更新关键结果当前值:', { goalUuid, keyResultId, currentValue });

      // 调用主进程更新关键结果
      const response = await goalIpcClient.updateKeyResultCurrentValue(goalUuid, keyResultId, currentValue);

      if (response.success && response.data) {
        // 同步到前端状态
        await this.syncGoalToState(response.data);

        console.log('✅ [目标应用服务] 关键结果当前值更新并同步成功');
        return {
          success: true,
          message: response.message,
          data: { goal: response.data },
        };
      }

      console.error('❌ [目标应用服务] 关键结果当前值更新失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 更新关键结果当前值异常:', error);
      return {
        success: false,
        message: `更新关键结果当前值失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 记录管理（聚合根驱动）==========

  async addRecordToGoal(
    goalUuid: string,
    keyResultId: string,
    value: number,
    note?: string
  ): Promise<TResponse<{ goal: IGoal; record: IRecord }>> {
    try {
      console.log('🔄 [目标应用服务] 为目标关键结果添加记录:', { goalUuid, keyResultId, value, note });

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.addRecordToGoal(goalUuid, keyResultId, value, note);

      if (response.success && response.data) {
        // 同步目标到前端状态（包含新记录）
        await this.syncGoalToState(response.data.goal);
        
        // 同步记录到前端状态
        await this.syncRecordToState(response.data.record);

        console.log('✅ [目标应用服务] 记录添加并同步成功:', response.data.record.uuid);
        return {
          success: true,
          message: response.message,
          data: response.data,
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

  async removeRecordFromGoal(goalUuid: string, recordId: string): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 从目标删除记录:', { goalUuid, recordId });

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.removeRecordFromGoal(goalUuid, recordId);

      if (response.success && response.data) {
        // 同步目标到前端状态
        await this.syncGoalToState(response.data.goal);
        
        // 从前端状态移除记录
        await this.removeRecordFromState(recordId);

        console.log('✅ [目标应用服务] 记录删除并同步成功:', recordId);
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

  async createRecord(recordData: IRecordCreateDTO): Promise<TResponse<{ record: IRecord }>> {
    try {
      console.log('🔄 [目标应用服务] 创建记录:', recordData);

      // 调用主进程创建记录
      const response = await goalIpcClient.createRecord(recordData);

      if (response.success && response.data) {
        // 同步到前端状态
        await this.syncRecordToState(response.data);

        console.log('✅ [目标应用服务] 记录创建并同步成功:', response.data.uuid);
        return {
          success: true,
          message: response.message,
          data: { record: response.data },
        };
      }

      console.error('❌ [目标应用服务] 记录创建失败:', response.message);
      return {
        success: false,
        message: response.message,
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 创建记录异常:', error);
      return {
        success: false,
        message: `创建记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async getAllRecords(): Promise<IRecord[]> {
    try {
      console.log('🔄 [目标应用服务] 获取所有记录');

      const response = await goalIpcClient.getAllRecords();

      if (response.success && response.data) {
        console.log(`✅ [目标应用服务] 获取记录成功，数量: ${response.data.length}`);
        return response.data;
      }

      console.error('❌ [目标应用服务] 获取记录失败:', response.message);
      return [];
    } catch (error) {
      console.error('❌ [目标应用服务] 获取记录异常:', error);
      return [];
    }
  }

  async getRecordsBygoalUuid(goalUuid: string): Promise<IRecord[]> {
    try {
      console.log('🔄 [目标应用服务] 获取目标记录:', goalUuid);

      const response = await goalIpcClient.getRecordsBygoalUuid(goalUuid);

      if (response.success && response.data) {
        console.log(`✅ [目标应用服务] 获取目标记录成功，数量: ${response.data.length}`);
        return response.data;
      }

      console.error('❌ [目标应用服务] 获取目标记录失败:', response.message);
      return [];
    } catch (error) {
      console.error('❌ [目标应用服务] 获取目标记录异常:', error);
      return [];
    }
  }

  // ========== 目标复盘管理（聚合根驱动）==========

  async addReviewToGoal(
    goalUuid: string,
    reviewData: IGoalReviewCreateDTO
  ): Promise<TResponse<{ goal: IGoal; review: IGoalReview }>> {
    try {
      console.log('🔄 [目标应用服务] 为目标添加复盘:', { goalUuid, reviewData });

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.addReviewToGoal(goalUuid, reviewData);

      if (response.success && response.data) {
        // 同步目标到前端状态（包含新复盘）
        await this.syncGoalToState(response.data.goal);

        console.log('✅ [目标应用服务] 复盘添加并同步成功:', response.data.review.uuid);
        return {
          success: true,
          message: response.message,
          data: response.data,
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

  async updateReviewInGoal(
    goalUuid: string,
    reviewId: string,
    updateData: Partial<IGoalReviewCreateDTO>
  ): Promise<TResponse<{ goal: IGoal; review: IGoalReview }>> {
    try {
      console.log('🔄 [目标应用服务] 更新目标复盘:', { goalUuid, reviewId, updateData });

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.updateReviewInGoal(goalUuid, reviewId, updateData);

      if (response.success && response.data) {
        // 同步目标到前端状态（包含更新的复盘）
        await this.syncGoalToState(response.data.goal);

        console.log('✅ [目标应用服务] 复盘更新并同步成功:', response.data.review.uuid);
        return {
          success: true,
          message: response.message,
          data: response.data,
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

  async removeReviewFromGoal(
    goalUuid: string,
    reviewId: string
  ): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [目标应用服务] 从目标移除复盘:', { goalUuid, reviewId });

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.removeReviewFromGoal(goalUuid, reviewId);

      if (response.success && response.data) {
        // 同步目标到前端状态（移除复盘后）
        await this.syncGoalToState(response.data.goal);

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

  async createGoalReviewSnapshot(goalUuid: string): Promise<TResponse<{ goal: IGoal; snapshot: any }>> {
    try {
      console.log('🔄 [目标应用服务] 为目标创建复盘快照:', goalUuid);

      // 调用主进程的聚合根方法
      const response = await goalIpcClient.createGoalReviewSnapshot(goalUuid);

      if (response.success && response.data) {
        console.log('✅ [目标应用服务] 复盘快照创建成功');
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      console.error('❌ [目标应用服务] 复盘快照创建失败:', response.message);
      return {
        success: false,
        message: response.message || '创建复盘快照失败',
      };
    } catch (error) {
      console.error('❌ [目标应用服务] 创建复盘快照异常:', error);
      return {
        success: false,
        message: `创建复盘快照失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 目标目录管理 ==========

  async createGoalDir(goalDirData: IGoalDir): Promise<TResponse<{ goalDir: IGoalDir }>> {
    try {
      console.log('🔍 [目标应用服务] 目录创建数据:', goalDirData);
      // 调用主进程创建目标目录
      const response = await goalIpcClient.createGoalDir(goalDirData);
      console.log('[目标应用服务] 接口响应:', response);
      if (response.success && response.data) {
        // 同步到前端状态
        await this.syncGoalDirToState(response.data);

        return {
          success: true,
          message: response.message,
          data: { goalDir: response.data },
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

  async getAllGoalDirs(): Promise<IGoalDir[]> {
    try {
      console.log('🔄 [目标应用服务] 获取所有目标目录');

      const response = await goalIpcClient.getAllGoalDirs();

      if (response.success && response.data) {
        console.log(`✅ [目标应用服务] 获取目标目录成功，数量: ${response.data.length}`);
        return response.data;
      }

      console.error('❌ [目标应用服务] 获取目标目录失败:', response.message);
      return [];
    } catch (error) {
      console.error('❌ [目标应用服务] 获取目标目录异常:', error);
      return [];
    }
  }

  async deleteGoalDir(goalDirId: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [目标应用服务] 删除目标目录:', goalDirId);

      // 调用主进程删除目标目录
      const response = await goalIpcClient.deleteGoalDir(goalDirId);

      if (response.success) {
        // 从前端状态移除
        await this.removeGoalDirFromState(goalDirId);

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

  async updateGoalDir(goalDirData: GoalDir | IGoalDir): Promise<TResponse<{ goalDir: IGoalDir }>> {
    try {
      console.log('🔄 [目标应用服务] 更新目标目录:', goalDirData.name);

      if (goalDirData instanceof GoalDir) {
        // 如果是 GoalDir 实例，转换为 IGoalDir
        goalDirData = goalDirData.toDTO();
      }

      // 调用主进程更新目标目录
      const response = await goalIpcClient.updateGoalDir(goalDirData);

      if (response.success && response.data) {
        // 同步到前端状态
        await this.syncGoalDirToState(response.data);

        console.log('✅ [目标应用服务] 目标目录更新并同步成功:', goalDirData);
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
      const [goals, records, goalDirs] = await Promise.all([
        this.getAllGoals(),
        this.getAllRecords(),
        this.getAllGoalDirs(),
      ]);

      // 同步到状态仓库
      await this.goalStore.syncAllGoalData({
        goals,
        records,
        goalDirs,
      });

      console.log('✅ [目标应用服务] 所有目标数据同步完成');
    } catch (error) {
      console.error('❌ [目标应用服务] 同步所有数据失败:', error);
    }
  }

  // ========== 私有方法：状态同步 ==========

  private async syncGoalToState(goal: IGoal): Promise<void> {
    try {
      await this.goalStore.updateGoal(goal);
    } catch (error) {
      console.warn('⚠️ 同步目标到状态失败:', error);
    }
  }

  private async removeGoalFromState(goalUuid: string): Promise<void> {
    try {
      await this.goalStore.removeGoal(goalUuid);
      await this.goalStore.removeRecordsBygoalUuid(goalUuid);
    } catch (error) {
      console.warn('⚠️ 从状态移除目标失败:', error);
    }
  }

  private async clearAllGoalsFromState(): Promise<void> {
    try {
      await this.goalStore.clearAllGoals();
      await this.goalStore.clearAllRecords();
    } catch (error) {
      console.warn('⚠️ 清空目标状态失败:', error);
    }
  }

  private async syncRecordToState(record: IRecord): Promise<void> {
    try {
      await this.goalStore.addRecord(record);
    } catch (error) {
      console.warn('⚠️ 同步记录到状态失败:', error);
    }
  }

  private async removeRecordFromState(recordId: string): Promise<void> {
    try {
      await this.goalStore.removeRecord(recordId);
    } catch (error) {
      console.warn('⚠️ 从状态移除记录失败:', error);
    }
  }

  private async syncGoalDirToState(goalDir: IGoalDir): Promise<void> {
    try {
      console.log('[目标应用服务] 同步目标目录到状态:', goalDir);
      await this.goalStore.addGoalDir(goalDir);
    } catch (error) {
      console.warn('⚠️ 同步目标目录到状态失败:', error);
    }
  }

  private async removeGoalDirFromState(goalDirId: string): Promise<void> {
    try {
      await this.goalStore.removeGoalDir(goalDirId);
    } catch (error) {
      console.warn('⚠️ 从状态移除目标目录失败:', error);
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