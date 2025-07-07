import type { TResponse } from "@/shared/types/response";
import type { 
  IGoal, 
  IGoalCreateDTO, 
  IRecord, 
  IRecordCreateDTO, 
  IGoalDir, 
  IGoalDirCreateDTO
} from "@/modules/Goal/domain/types/goal";
import { Goal } from "@/modules/Goal/domain/entities/goal";
import { GoalDir } from "@/modules/Goal/domain/entities/goalDir";
import { GoalContainer } from "../infrastructure/di/goalContainer";
import type { IGoalRepository } from "../domain/repositories/iGoalRepository";

/**
 * 主进程目标应用服务
 * 处理目标相关的业务逻辑和数据库操作
 * 
 * 职责：
 * 1. 目标的CRUD操作
 * 2. 关键结果管理
 * 3. 记录管理
 * 4. 目标目录管理
 * 5. 数据验证和业务规则执行
 */
export class MainGoalApplicationService {
  private goalRepository: IGoalRepository | null = null;

  constructor() {
    // 延迟初始化仓库，因为需要异步操作
  }

  /**
   * 获取 Goal 仓库实例
   */
  private async getRepository(): Promise<IGoalRepository> {
    if (!this.goalRepository) {
      const container = GoalContainer.getInstance();
      this.goalRepository = await container.getGoalRepository();
    }
    return this.goalRepository;
  }

  /**
   * 设置当前用户名
   */
  async setUsername(username: string): Promise<void> {
    const container = GoalContainer.getInstance();
    await container.setCurrentUser(username);
  }

  // ========== 目标管理 ==========

  /**
   * 创建目标
   */
  async createGoal(goalData: IGoalCreateDTO): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [主进程] 创建目标:', goalData.title);

      // 验证数据
      const validation = Goal.validate(goalData);
      if (!validation.isValid) {
        return {
          success: false,
          message: `目标数据验证失败: ${validation.errors.join(', ')}`,
        };
      }

      // 通过仓库创建目标
      const repository = await this.getRepository();
      const goal = await repository.createGoal(goalData);

      console.log('✅ [主进程] 目标创建成功:', goal.id);
      return {
        success: true,
        message: '目标创建成功',
        data: goal.toDTO(),
      };
    } catch (error) {
      console.error('❌ [主进程] 创建目标失败:', error);
      return {
        success: false,
        message: `创建目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有目标
   */
  async getAllGoals(): Promise<TResponse<IGoal[]>> {
    try {
      console.log('🔄 [主进程] 获取所有目标');

      const repository = await this.getRepository();
      const goals = await repository.getAllGoals();
      const goalDTOs = goals.map(goal => goal.toDTO());

      console.log(`✅ [主进程] 获取目标成功，数量: ${goals.length}`);
      return {
        success: true,
        message: '获取目标成功',
        data: goalDTOs,
      };
    } catch (error) {
      console.error('❌ [主进程] 获取目标失败:', error);
      return {
        success: false,
        message: `获取目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 根据ID获取目标
   */
  async getGoalById(goalId: string): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [主进程] 获取目标:', goalId);

      const repository = await this.getRepository();
      const goal = await repository.getGoalById(goalId);
      
      if (!goal) {
        return {
          success: false,
          message: `目标不存在: ${goalId}`,
        };
      }

      console.log('✅ [主进程] 获取目标成功:', goalId);
      return {
        success: true,
        message: '获取目标成功',
        data: goal.toDTO(),
      };
    } catch (error) {
      console.error('❌ [主进程] 获取目标失败:', error);
      return {
        success: false,
        message: `获取目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标
   */
  async updateGoal(goalData: IGoal): Promise<TResponse<IGoal>> {
    try {
      console.log('🔄 [主进程] 更新目标:', goalData.id);

      const repository = await this.getRepository();
      
      // 首先检查目标是否存在
      const existingGoal = await repository.getGoalById(goalData.id);
      if (!existingGoal) {
        return {
          success: false,
          message: `目标不存在: ${goalData.id}`,
        };
      }

      // 更新目标
      const updates = {
        title: goalData.title,
        description: goalData.description,
        color: goalData.color,
        dirId: goalData.dirId,
        startTime: goalData.startTime,
        endTime: goalData.endTime,
        note: goalData.note,
        keyResults: goalData.keyResults.map(kr => ({
          name: kr.name,
          startValue: kr.startValue,
          targetValue: kr.targetValue,
          currentValue: kr.currentValue,
          calculationMethod: kr.calculationMethod,
          weight: kr.weight
        })),
        analysis: goalData.analysis
      };

      const updatedGoal = await repository.updateGoal(goalData.id, updates);

      console.log('✅ [主进程] 目标更新成功:', goalData.id);
      return {
        success: true,
        message: '目标更新成功',
        data: updatedGoal.toDTO(),
      };
    } catch (error) {
      console.error('❌ [主进程] 更新目标失败:', error);
      return {
        success: false,
        message: `更新目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(goalId: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [主进程] 删除目标:', goalId);

      const repository = await this.getRepository();
      
      // 检查目标是否存在
      const goal = await repository.getGoalById(goalId);
      if (!goal) {
        return {
          success: false,
          message: `目标不存在: ${goalId}`,
        };
      }

      // 获取相关记录
      const relatedRecords = await repository.getRecordsByGoal(goalId);

      // 删除目标（这会级联删除相关记录）
      await repository.deleteGoal(goalId);

      console.log('✅ [主进程] 目标删除成功:', goalId);
      return {
        success: true,
        message: `目标删除成功，同时删除了 ${relatedRecords.length} 条相关记录`,
      };
    } catch (error) {
      console.error('❌ [主进程] 删除目标失败:', error);
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
      console.log('🔄 [主进程] 删除所有目标');

      const repository = await this.getRepository();
      
      // 获取所有目标
      const goals = await repository.getAllGoals();
      const goalIds = goals.map(goal => goal.id);

      // 获取所有记录
      const allRecords = [];
      for (const goal of goals) {
        const records = await repository.getRecordsByGoal(goal.id);
        allRecords.push(...records);
      }

      // 批量删除目标
      await repository.batchDeleteGoals(goalIds);

      console.log('✅ [主进程] 所有目标删除成功');
      return {
        success: true,
        message: `删除了 ${goals.length} 个目标和 ${allRecords.length} 条记录`,
      };
    } catch (error) {
      console.error('❌ [主进程] 删除所有目标失败:', error);
      return {
        success: false,
        message: `删除所有目标失败: ${error instanceof Error ? error.message : '未知错误'}`,
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
      console.log('🔄 [主进程] 更新关键结果当前值:', { goalId, keyResultId, currentValue });

      const repository = await this.getRepository();
      
      // 获取目标
      const goal = await repository.getGoalById(goalId);
      if (!goal) {
        return {
          success: false,
          message: `目标不存在: ${goalId}`,
        };
      }

      // 更新关键结果当前值
      goal.updateKeyResultCurrentValue(keyResultId, currentValue);

      // 保存更新
      const updatedGoal = await repository.updateGoal(goalId, {
        keyResults: goal.keyResults.map(kr => ({
          name: kr.name,
          startValue: kr.startValue,
          targetValue: kr.targetValue,
          currentValue: kr.currentValue,
          calculationMethod: kr.calculationMethod,
          weight: kr.weight
        }))
      });

      console.log('✅ [主进程] 关键结果当前值更新成功');
      return {
        success: true,
        message: '关键结果当前值更新成功',
        data: updatedGoal.toDTO(),
      };
    } catch (error) {
      console.error('❌ [主进程] 更新关键结果当前值失败:', error);
      return {
        success: false,
        message: `更新关键结果当前值失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 为目标的关键结果添加记录（通过聚合根）
   */
  async addRecordToGoal(goalId: string, keyResultId: string, value: number, note?: string): Promise<TResponse<{ goal: IGoal; record: IRecord }>> {
    try {
      console.log('🔄 [主进程] 为目标关键结果添加记录:', { goalId, keyResultId, value, note });

      if (value <= 0) {
        return {
          success: false,
          message: '记录值必须大于0',
        };
      }

      const repository = await this.getRepository();

      // 获取目标聚合根
      const goal = await repository.getGoalById(goalId);
      if (!goal) {
        return {
          success: false,
          message: `目标不存在: ${goalId}`,
        };
      }

      // 通过聚合根添加记录
      const record = goal.addRecord(keyResultId, value, note);

      // 保存更新后的聚合根
      const updatedGoal = await repository.updateGoal(goalId, goal.toDTO());

      console.log('✅ [主进程] 记录添加成功:', record.id);
      return {
        success: true,
        message: '记录添加成功',
        data: { 
          goal: updatedGoal.toDTO(),
          record: record.toDTO()
        },
      };
    } catch (error) {
      console.error('❌ [主进程] 添加记录失败:', error);
      return {
        success: false,
        message: `添加记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 创建记录（兼容性方法，推荐使用 addRecordToGoal）
   */
  async createRecord(recordData: IRecordCreateDTO): Promise<TResponse<IRecord>> {
    try {
      console.log('🔄 [主进程] 创建记录:', recordData);

      // 委托给聚合根方法
      const result = await this.addRecordToGoal(
        recordData.goalId,
        recordData.keyResultId,
        recordData.value,
        recordData.note
      );

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
    } catch (error) {
      console.error('❌ [主进程] 创建记录失败:', error);
      return {
        success: false,
        message: `创建记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有记录
   */
  async getAllRecords(): Promise<TResponse<IRecord[]>> {
    try {
      console.log('🔄 [主进程] 获取所有记录');

      const repository = await this.getRepository();
      const goals = await repository.getAllGoals();
      
      const allRecords = [];
      for (const goal of goals) {
        const records = await repository.getRecordsByGoal(goal.id);
        allRecords.push(...records);
      }

      const recordDTOs = allRecords.map(record => record.toDTO());

      console.log(`✅ [主进程] 获取记录成功，数量: ${allRecords.length}`);
      return {
        success: true,
        message: '获取记录成功',
        data: recordDTOs,
      };
    } catch (error) {
      console.error('❌ [主进程] 获取记录失败:', error);
      return {
        success: false,
        message: `获取记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 根据目标ID获取记录
   */
  async getRecordsByGoalId(goalId: string): Promise<TResponse<IRecord[]>> {
    try {
      console.log('🔄 [主进程] 获取目标记录:', goalId);

      const repository = await this.getRepository();
      const records = await repository.getRecordsByGoal(goalId);
      const recordDTOs = records.map(record => record.toDTO());

      console.log(`✅ [主进程] 获取目标记录成功，数量: ${records.length}`);
      return {
        success: true,
        message: '获取记录成功',
        data: recordDTOs,
      };
    } catch (error) {
      console.error('❌ [主进程] 获取目标记录失败:', error);
      return {
        success: false,
        message: `获取记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除记录
   */
  async deleteRecord(recordId: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [主进程] 删除记录:', recordId);

      const repository = await this.getRepository();
      
      // 删除记录
      await repository.deleteRecord(recordId);

      console.log('✅ [主进程] 记录删除成功:', recordId);
      return {
        success: true,
        message: '记录删除成功',
      };
    } catch (error) {
      console.error('❌ [主进程] 删除记录失败:', error);
      return {
        success: false,
        message: `删除记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 目标目录管理 ==========

  /**
   * 创建目标目录
   */
  async createGoalDir(goalDirData: IGoalDirCreateDTO): Promise<TResponse<IGoalDir>> {
    try {
      console.log('🔄 [主进程] 创建目标目录:', goalDirData.name);

      // 验证数据
      const validation = GoalDir.validate(goalDirData);
      if (!validation.isValid) {
        return {
          success: false,
          message: `目录数据验证失败: ${validation.errors.join(', ')}`,
        };
      }

      const repository = await this.getRepository();
      const goalDir = await repository.createGoalDirectory(goalDirData);

      console.log('✅ [主进程] 目标目录创建成功:', goalDir.id);
      return {
        success: true,
        message: '目标目录创建成功',
        data: goalDir.toDTO(),
      };
    } catch (error) {
      console.error('❌ [主进程] 创建目标目录失败:', error);
      return {
        success: false,
        message: `创建目标目录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 获取所有目标目录
   */
  async getAllGoalDirs(): Promise<TResponse<IGoalDir[]>> {
    try {
      console.log('🔄 [主进程] 获取所有目标目录');

      const repository = await this.getRepository();
      const goalDirs = await repository.getAllGoalDirectories();
      const goalDirDTOs = goalDirs.map(goalDir => goalDir.toDTO());

      console.log(`✅ [主进程] 获取目标目录成功，数量: ${goalDirs.length}`);
      return {
        success: true,
        message: '获取目标目录成功',
        data: goalDirDTOs,
      };
    } catch (error) {
      console.error('❌ [主进程] 获取目标目录失败:', error);
      return {
        success: false,
        message: `获取目标目录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标目录
   */
  async deleteGoalDir(goalDirId: string): Promise<TResponse<void>> {
    try {
      console.log('🔄 [主进程] 删除目标目录:', goalDirId);

      const repository = await this.getRepository();

      // 检查目录是否存在
      const goalDir = await repository.getGoalDirectoryById(goalDirId);
      if (!goalDir) {
        return {
          success: false,
          message: `目标目录不存在: ${goalDirId}`,
        };
      }

      // 检查是否有目标使用此目录
      const goalsInDir = await repository.getGoalsByDirectory(goalDirId);
      if (goalsInDir.length > 0) {
        return {
          success: false,
          message: `无法删除目录，还有 ${goalsInDir.length} 个目标在使用此目录`,
        };
      }

      // 删除目录
      await repository.deleteGoalDirectory(goalDirId);

      console.log('✅ [主进程] 目标目录删除成功:', goalDirId);
      return {
        success: true,
        message: '目标目录删除成功',
      };
    } catch (error) {
      console.error('❌ [主进程] 删除目标目录失败:', error);
      return {
        success: false,
        message: `删除目标目录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 为目标添加关键结果（通过聚合根）
   */
  async addKeyResultToGoal(
    goalId: string,
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
      console.log('🔄 [主进程] 为目标添加关键结果:', { goalId, ...keyResultData });

      const repository = await this.getRepository();
      const goalWithRecords = await repository.getGoalById(goalId);
      
      if (!goalWithRecords) {
        return {
          success: false,
          message: '目标不存在',
        };
      }

      // 填充默认值
      const fullKeyResultData = {
        name: keyResultData.name,
        startValue: keyResultData.startValue,
        targetValue: keyResultData.targetValue,
        currentValue: keyResultData.currentValue ?? keyResultData.startValue,
        calculationMethod: keyResultData.calculationMethod ?? 'sum' as const,
        weight: keyResultData.weight ?? 1,
      };

      // 通过聚合根添加关键结果
      const keyResultId = goalWithRecords.addKeyResult(fullKeyResultData);

      // 保存到数据库
      await repository.updateGoal(goalId, {
        title: goalWithRecords.title,
        description: goalWithRecords.description,
        color: goalWithRecords.color,
        dirId: goalWithRecords.dirId,
        startTime: goalWithRecords.startTime,
        endTime: goalWithRecords.endTime,
        note: goalWithRecords.note,
        keyResults: goalWithRecords.keyResults,
      });

      console.log('✅ [主进程] 关键结果添加成功:', keyResultId);
      return {
        success: true,
        message: '关键结果添加成功',
        data: { 
          goal: goalWithRecords.toDTO(),
          keyResultId: keyResultId
        },
      };
    } catch (error) {
      console.error('❌ [主进程] 添加关键结果失败:', error);
      return {
        success: false,
        message: `添加关键结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 删除目标的关键结果（通过聚合根）
   */
  async removeKeyResultFromGoal(goalId: string, keyResultId: string): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [主进程] 删除目标关键结果:', { goalId, keyResultId });

      const repository = await this.getRepository();
      const goalWithRecords = await repository.getGoalById(goalId);
      
      if (!goalWithRecords) {
        return {
          success: false,
          message: '目标不存在',
        };
      }

      // 通过聚合根删除关键结果（会自动删除相关记录）
      goalWithRecords.removeKeyResult(keyResultId);

      // 保存到数据库
      await repository.updateGoal(goalId, {
        title: goalWithRecords.title,
        description: goalWithRecords.description,
        color: goalWithRecords.color,
        dirId: goalWithRecords.dirId,
        startTime: goalWithRecords.startTime,
        endTime: goalWithRecords.endTime,
        note: goalWithRecords.note,
        keyResults: goalWithRecords.keyResults,
      });

      console.log('✅ [主进程] 关键结果删除成功:', keyResultId);
      return {
        success: true,
        message: '关键结果删除成功',
        data: { goal: goalWithRecords.toDTO() },
      };
    } catch (error) {
      console.error('❌ [主进程] 删除关键结果失败:', error);
      return {
        success: false,
        message: `删除关键结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 更新目标的关键结果（通过聚合根）
   */
  async updateKeyResultOfGoal(
    goalId: string,
    keyResultId: string,
    updates: {
      name?: string;
      targetValue?: number;
      weight?: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    }
  ): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [主进程] 更新目标关键结果:', { goalId, keyResultId, updates });

      const repository = await this.getRepository();
      const goalWithRecords = await repository.getGoalById(goalId);
      
      if (!goalWithRecords) {
        return {
          success: false,
          message: '目标不存在',
        };
      }

      // 通过聚合根更新关键结果
      goalWithRecords.updateKeyResult(keyResultId, updates);

      // 保存到数据库
      await repository.updateGoal(goalId, {
        title: goalWithRecords.title,
        description: goalWithRecords.description,
        color: goalWithRecords.color,
        dirId: goalWithRecords.dirId,
        startTime: goalWithRecords.startTime,
        endTime: goalWithRecords.endTime,
        note: goalWithRecords.note,
        keyResults: goalWithRecords.keyResults,
      });

      console.log('✅ [主进程] 关键结果更新成功:', keyResultId);
      return {
        success: true,
        message: '关键结果更新成功',
        data: { goal: goalWithRecords.toDTO() },
      };
    } catch (error) {
      console.error('❌ [主进程] 更新关键结果失败:', error);
      return {
        success: false,
        message: `更新关键结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // ========== 记录管理 ==========

  /**
   * 从目标中删除记录（通过聚合根）
   */
  async removeRecordFromGoal(goalId: string, recordId: string): Promise<TResponse<{ goal: IGoal }>> {
    try {
      console.log('🔄 [主进程] 从目标删除记录:', { goalId, recordId });

      const repository = await this.getRepository();
      const goalWithRecords = await repository.getGoalById(goalId);
      
      if (!goalWithRecords) {
        return {
          success: false,
          message: '目标不存在',
        };
      }

      // 通过聚合根删除记录
      goalWithRecords.removeRecord(recordId);

      // 保存到数据库
      await repository.updateGoal(goalId, {
        title: goalWithRecords.title,
        description: goalWithRecords.description,
        color: goalWithRecords.color,
        dirId: goalWithRecords.dirId,
        startTime: goalWithRecords.startTime,
        endTime: goalWithRecords.endTime,
        note: goalWithRecords.note,
        keyResults: goalWithRecords.keyResults,
      });

      console.log('✅ [主进程] 记录删除成功:', recordId);
      return {
        success: true,
        message: '记录删除成功',
        data: { goal: goalWithRecords.toDTO() },
      };
    } catch (error) {
      console.error('❌ [主进程] 删除记录失败:', error);
      return {
        success: false,
        message: `删除记录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}
