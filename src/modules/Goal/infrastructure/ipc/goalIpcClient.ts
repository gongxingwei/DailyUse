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
import { deepSerializeForIpc } from "@/shared/utils/ipcSerialization";
import { ipcInvokeWithAuth } from "@/shared/utils/ipcInvokeWithAuth";
/**
 * 目标模块 IPC 客户端
 * 处理渲染进程与主进程之间的目标相关通信
 */
export class GoalIpcClient {
  // ========== 目标管理 ==========
  name = 'GoalIpcClient';
  /**
   * 创建目标
   */
  async createGoal(goalData: IGoalCreateDTO): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 创建目标:', goalData.name);

      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalData);

      const response = await ipcInvokeWithAuth('goal:create', serializedData);

      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标创建成功:', response.data?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 目标创建失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 创建目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有目标
   */
  async getAllGoals(): Promise<TResponse<IGoal[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有目标');
      
      const response = await ipcInvokeWithAuth('goal:get-all');
      
      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取目标成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 根据ID获取目标
   */
  async getGoalById(goalUuid: string): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取目标:', goalUuid);
      
      const response = await ipcInvokeWithAuth('goal:get-by-id', goalUuid);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 获取目标成功:', goalUuid);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标
   */
  async updateGoal(goalData: IGoal): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 更新目标:', goalData.uuid);
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalData);
      
      const response = await ipcInvokeWithAuth('goal:update', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标更新成功:', goalData.uuid);
      } else {
        console.error('❌ [渲染进程-IPC] 目标更新失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(goalUuid: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除目标:', goalUuid);
      
      const response = await ipcInvokeWithAuth('goal:delete', goalUuid);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标删除成功:', goalUuid);
      } else {
        console.error('❌ [渲染进程-IPC] 目标删除失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除所有目标
   */
  async deleteAllGoals(): Promise<TResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除所有目标');
      
      const response = await ipcInvokeWithAuth('goal:delete-all');
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 所有目标删除成功');
      } else {
        console.error('❌ [渲染进程-IPC] 删除所有目标失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除所有目标通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 关键结果管理 ==========

  /**
   * 为目标添加关键结果（聚合根驱动）
   */
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
      console.log('🔄 [渲染进程-IPC] 为目标添加关键结果:', { goalUuid, ...keyResultData });
      
      const response = await ipcInvokeWithAuth('goal:addKeyResult', goalUuid, keyResultData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 关键结果添加成功:', response.data?.keyResultId);
      } else {
        console.error('❌ [渲染进程-IPC] 关键结果添加失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 添加关键结果通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标的关键结果（聚合根驱动）
   */
  async removeKeyResultFromGoal(goalUuid: string, keyResultId: string): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除目标关键结果:', { goalUuid, keyResultId });
      
      const response = await ipcInvokeWithAuth('goal:removeKeyResult', goalUuid, keyResultId);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 关键结果删除成功:', keyResultId);
      } else {
        console.error('❌ [渲染进程-IPC] 关键结果删除失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除关键结果通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标的关键结果（聚合根驱动）
   */
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
      console.log('🔄 [渲染进程-IPC] 更新目标关键结果:', { goalUuid, keyResultId, updates });
      
      const response = await ipcInvokeWithAuth('goal:updateKeyResult', goalUuid, keyResultId, updates);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 关键结果更新成功:', keyResultId);
      } else {
        console.error('❌ [渲染进程-IPC] 关键结果更新失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新关键结果通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新关键结果当前值
   */
  async updateKeyResultCurrentValue(
    goalUuid: string, 
    keyResultId: string, 
    currentValue: number
  ): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 更新关键结果当前值:', { goalUuid, keyResultId, currentValue });
      
      const response = await ipcInvokeWithAuth(
        'goal:updateKeyResultCurrentValue', 
        goalUuid, 
        keyResultId, 
        currentValue
      );
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 关键结果当前值更新成功');
      } else {
        console.error('❌ [渲染进程-IPC] 关键结果当前值更新失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新关键结果当前值通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 记录管理 ==========

  /**
   * 创建记录
   */
  async createRecord(recordData: IRecordCreateDTO): Promise<TResponse<IRecord>> {
    try {
      console.log('🔄 [渲染进程-IPC] 创建记录:', recordData);
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(recordData);
      
      const response = await ipcInvokeWithAuth('goal:createRecord', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 记录创建成功:', response.data?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 记录创建失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 创建记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有记录
   */
  async getAllRecords(): Promise<TResponse<IRecord[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有记录');
      
      const response = await ipcInvokeWithAuth('goal:getAllRecords');
      
      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取记录成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取记录失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 根据目标ID获取记录
   */
  async getRecordsBygoalUuid(goalUuid: string): Promise<TResponse<IRecord[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取目标记录:', goalUuid);
      
      const response = await ipcInvokeWithAuth('goal:getRecordsByGoal', goalUuid);
      
      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取目标记录成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标记录失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除记录
   */
  async deleteRecord(recordId: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除记录:', recordId);
      
      const response = await ipcInvokeWithAuth('goal:deleteRecord', recordId);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 记录删除成功:', recordId);
      } else {
        console.error('❌ [渲染进程-IPC] 记录删除失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 为目标的关键结果添加记录（聚合根驱动）
   */
  async addRecordToGoal(
    goalUuid: string, 
    keyResultId: string, 
    value: number, 
    note?: string
  ): Promise<TResponse<{ goal: IGoal; record: IRecord }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 为目标关键结果添加记录:', { goalUuid, keyResultId, value, note });
      
      const response = await ipcInvokeWithAuth(
        'goal:addRecordToGoal', 
        goalUuid, 
        keyResultId, 
        value, 
        note
      );
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 记录添加成功:', response.data?.record?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 记录添加失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 添加记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 创建记录（兼容性方法，推荐使用 addRecordToGoal）
   */
  async createRecordCompat(
    goalUuid: string, 
    keyResultId: string, 
    value: number, 
    note?: string
  ): Promise<TResponse<IRecord>> {
    const result = await this.addRecordToGoal(goalUuid, keyResultId, value, note);
    
    if (result.success && result.data) {
      return {
        success: true,
        message: result.message,
        data: result.data.record,
      };
    }
    
    return {
      success: false,
      message: result.message,
    };
  }

  /**
   * 从目标中删除记录（聚合根驱动）
   */
  async removeRecordFromGoal(goalUuid: string, recordId: string): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 从目标删除记录:', { goalUuid, recordId });
      
      const response = await ipcInvokeWithAuth('goal:removeRecord', goalUuid, recordId);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 记录删除成功:', recordId);
      } else {
        console.error('❌ [渲染进程-IPC] 记录删除失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除记录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 目标复盘管理 ==========

  /**
   * 为目标添加复盘
   */
  async addReviewToGoal(
    goalUuid: string,
    reviewData: IGoalReviewCreateDTO
  ): Promise<TResponse<{ goal: IGoal; review: IGoalReview }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 为目标添加复盘:', goalUuid);
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc({ goalUuid, reviewData });
      
      const response = await ipcInvokeWithAuth('goal:addReview', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 复盘添加成功:', response.data?.review?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 复盘添加失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 添加复盘通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标的复盘
   */
  async updateReviewInGoal(
    goalUuid: string,
    reviewId: string,
    updateData: Partial<IGoalReviewCreateDTO>
  ): Promise<TResponse<{ goal: IGoal; review: IGoalReview }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 更新目标复盘:', { goalUuid, reviewId });
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc({ goalUuid, reviewId, updateData });
      
      const response = await ipcInvokeWithAuth('goal:updateReview', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 复盘更新成功:', response.data?.review?.id);
      } else {
        console.error('❌ [渲染进程-IPC] 复盘更新失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新复盘通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 从目标中移除复盘
   */
  async removeReviewFromGoal(
    goalUuid: string,
    reviewId: string
  ): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 从目标移除复盘:', { goalUuid, reviewId });
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc({ goalUuid, reviewId });
      
      const response = await ipcInvokeWithAuth('goal:removeReview', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 复盘移除成功');
      } else {
        console.error('❌ [渲染进程-IPC] 复盘移除失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 移除复盘通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取目标的所有复盘
   */
  async getGoalReviews(goalUuid: string): Promise<TResponse<IGoalReview[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取目标复盘:', goalUuid);
      
      const response = await ipcInvokeWithAuth('goal:getReviews', goalUuid);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 获取目标复盘成功:', response.data?.length);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标复盘失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标复盘通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 为目标创建复盘快照
   */
  async createGoalReviewSnapshot(goalUuid: string): Promise<TResponse<{ goal: IGoal; snapshot: any }>> {
    try {
      console.log('🔄 [渲染进程-IPC] 为目标创建复盘快照:', goalUuid);
      
      const response = await ipcInvokeWithAuth('goal:createReviewSnapshot', goalUuid);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 复盘快照创建成功');
      } else {
        console.error('❌ [渲染进程-IPC] 复盘快照创建失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 创建复盘快照通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 目标目录管理 ==========

  /**
   * 创建目标目录
   */
  async createGoalDir(goalDirData: IGoalDir): Promise<TResponse<IGoalDir>> {
    try {
      console.log('🔄 [渲染进程-IPC] 创建目标目录:', goalDirData.name);
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalDirData);
      console.log('🔄 [渲染进程-IPC] 序列化目标目录数据:', serializedData);
      const response = await ipcInvokeWithAuth('goal:dir:create', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标目录创建成功:', response.data);
      } else {
        console.error('❌ [渲染进程-IPC] 目标目录创建失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 创建目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有目标目录
   */
  async getAllGoalDirs(): Promise<TResponse<IGoalDir[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取所有目标目录');
      
      const response = await ipcInvokeWithAuth('goal:dir:get-all');
      
      if (response.success) {
        console.log(`✅ [渲染进程-IPC] 获取目标目录成功，数量: ${response.data?.length || 0}`);
      } else {
        console.error('❌ [渲染进程-IPC] 获取目标目录失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 获取目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标目录
   */
  async deleteGoalDir(goalDirId: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除目标目录:', goalDirId);
      
      const response = await ipcInvokeWithAuth('goal:dir:delete', goalDirId);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标目录删除成功:', goalDirId);
      } else {
        console.error('❌ [渲染进程-IPC] 目标目录删除失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 删除目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标目录
   */
  async updateGoalDir(goalDirData: IGoalDir): Promise<TResponse<IGoalDir>> {
    try {
      console.log('🔄 [渲染进程-IPC] 更新目标目录:', goalDirData.name);
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalDirData);
      
      const response = await ipcInvokeWithAuth('goal:dir:update', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标目录更新成功:', goalDirData);
      } else {
        console.error('❌ [渲染进程-IPC] 目标目录更新失败:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [渲染进程-IPC] 更新目标目录通信错误:', error);
      return {
        success: false,
        message: `IPC通信失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}

// 导出单例实例
export const goalIpcClient = new GoalIpcClient();
