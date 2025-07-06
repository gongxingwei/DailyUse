import type { TResponse } from "@/shared/types/response";
import type { 
  IGoal, 
  IGoalCreateDTO, 
  IRecord, 
  IRecordCreateDTO, 
  IGoalDir, 
  IGoalDirCreateDTO 
} from "../../domain/types/goal";
import { deepSerializeForIpc } from "@/shared/utils/ipcSerialization";

/**
 * 目标模块 IPC 客户端
 * 处理渲染进程与主进程之间的目标相关通信
 */
export class GoalIpcClient {
  // ========== 目标管理 ==========

  /**
   * 创建目标
   */
  async createGoal(goalData: IGoalCreateDTO): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 创建目标:', goalData.title);
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalData);
      
      const response = await window.shared.ipcRenderer.invoke('goal:create', serializedData);
      
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
      
      const response = await window.shared.ipcRenderer.invoke('goal:get-all');
      
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
  async getGoalById(goalId: string): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取目标:', goalId);
      
      const response = await window.shared.ipcRenderer.invoke('goal:get-by-id', goalId);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 获取目标成功:', goalId);
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
      console.log('🔄 [渲染进程-IPC] 更新目标:', goalData.id);
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalData);
      
      const response = await window.shared.ipcRenderer.invoke('goal:update', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标更新成功:', goalData.id);
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
  async deleteGoal(goalId: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [渲染进程-IPC] 删除目标:', goalId);
      
      const response = await window.shared.ipcRenderer.invoke('goal:delete', goalId);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标删除成功:', goalId);
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
      
      const response = await window.shared.ipcRenderer.invoke('goal:delete-all');
      
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
   * 更新关键结果当前值
   */
  async updateKeyResultCurrentValue(
    goalId: string, 
    keyResultId: string, 
    currentValue: number
  ): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [渲染进程-IPC] 更新关键结果当前值:', { goalId, keyResultId, currentValue });
      
      const response = await window.shared.ipcRenderer.invoke(
        'goal:key-result:update-current-value', 
        goalId, 
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
      
      const response = await window.shared.ipcRenderer.invoke('goal:record:create', serializedData);
      
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
      
      const response = await window.shared.ipcRenderer.invoke('goal:record:get-all');
      
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
  async getRecordsByGoalId(goalId: string): Promise<TResponse<IRecord[]>> {
    try {
      console.log('🔄 [渲染进程-IPC] 获取目标记录:', goalId);
      
      const response = await window.shared.ipcRenderer.invoke('goal:record:get-by-goal-id', goalId);
      
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
      
      const response = await window.shared.ipcRenderer.invoke('goal:record:delete', recordId);
      
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

  // ========== 目标目录管理 ==========

  /**
   * 创建目标目录
   */
  async createGoalDir(goalDirData: IGoalDirCreateDTO): Promise<TResponse<IGoalDir>> {
    try {
      console.log('🔄 [渲染进程-IPC] 创建目标目录:', goalDirData.name);
      
      // 使用深度序列化确保数据可以安全传输
      const serializedData = deepSerializeForIpc(goalDirData);
      
      const response = await window.shared.ipcRenderer.invoke('goal:dir:create', serializedData);
      
      if (response.success) {
        console.log('✅ [渲染进程-IPC] 目标目录创建成功:', response.data?.id);
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
      
      const response = await window.shared.ipcRenderer.invoke('goal:dir:get-all');
      
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
      
      const response = await window.shared.ipcRenderer.invoke('goal:dir:delete', goalDirId);
      
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
}

// 导出单例实例
export const goalIpcClient = new GoalIpcClient();
