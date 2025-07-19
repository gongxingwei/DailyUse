import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
import type { ITaskInstanceRepository } from '../../domain/repositories/iTaskInstanceRepository';
import type { TaskInstance } from '../../domain/aggregates/taskInstance';
import type { DateTime } from '@/shared/types/myDateTime';

/**
 * TaskInstance存储库实现
 * 
 * 职责：
 * - 实现TaskInstance的数据访问层接口
 * - 处理TaskInstance的CRUD操作
 * - 提供各种查询方法（按时间、目标、模板等）
 * - 与任务存储系统交互
 * 
 * 说明：
 * - TaskInstance是基于TaskTemplate创建的具体任务执行实例
 * - 具有确切的执行时间和具体的任务内容
 * - 是实际执行和跟踪的任务单位
 * - 层次关系：TaskMetaTemplate -> TaskTemplate -> TaskInstance
 */
export class TaskInstanceStoreRepository implements ITaskInstanceRepository {
  private store = useTaskStore();

  /**
   * 设置当前用户（Store 模式下可能不需要实际操作，但需要接口兼容）
   */
  setCurrentUser(username: string): void {
    // Store 模式下，用户隔离通过 store 的逻辑处理
    // 这里可以扩展为通知 store 当前用户变更
    console.log(`TaskInstanceStoreRepository: 设置当前用户为 ${username}`);
  }

  /**
   * 保存TaskInstance到存储系统
   * 
   * @param instance - 要保存的TaskInstance实例
   * @returns 保存操作的响应结果
   */
  async save(instance: TaskInstance): Promise<TResponse<TaskInstance>> {
    const response = await this.store.addTaskInstance(instance);
    if (response.success) {
      await this.store.saveTaskInstances();
    }
    return response;
  }

  /**
   * 批量保存多个TaskInstance
   * 
   * 通常用于从TaskTemplate批量生成TaskInstance时的保存操作。
   * 
   * @param instances - 要保存的TaskInstance数组
   * @returns 批量保存操作的响应结果
   */
  async saveAll(instances: TaskInstance[]): Promise<TResponse<TaskInstance[]>> {
    const response = await this.store.addTaskInstances(instances);
    if (response.success) {
      await this.store.saveTaskInstances();
    }
    return response;
  }

  /**
   * 根据ID查找TaskInstance
   * 
   * @param id - TaskInstance的唯一标识符
   * @returns 查找操作的响应结果
   */
  async findById(id: string): Promise<TResponse<TaskInstance>> {
    try {
      const instance = this.store.getTaskInstanceById(id);
      
      if (instance) {
        return {
          success: true,
          message: 'TaskInstance查询成功',
          data: instance
        };
      } else {
        return {
          success: false,
          message: `未找到ID为 ${id} 的TaskInstance`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '查询TaskInstance失败',
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 获取所有TaskInstance
   * 
   * @returns 所有TaskInstance的响应结果
   */
  async findAll(): Promise<TResponse<TaskInstance[]>> {
    try {
      const instances = this.store.getAllTaskInstances;
      
      return {
        success: true,
        message: `找到 ${instances.length} 个TaskInstance`,
        data: instances
      };
    } catch (error) {
      return {
        success: false,
        message: '查询TaskInstance列表失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 根据时间范围查找TaskInstance
   * 
   * 查找在指定时间范围内计划执行的TaskInstance。
   * 用于日程安排、时间冲突检测等功能。
   * 
   * @param start - 开始时间
   * @param end - 结束时间
   * @returns 指定时间范围内的TaskInstance响应结果
   */
  async findByDateRange(start: DateTime, end: DateTime): Promise<TResponse<TaskInstance[]>> {
    try {
      const instances = this.store.getAllTaskInstances
        .filter(instance => {
          const instanceTime = instance.scheduledTime?.timestamp || 0;
          return instanceTime >= start.timestamp && instanceTime <= end.timestamp;
        });
      
      return {
        success: true,
        message: `在指定时间范围内找到 ${instances.length} 个TaskInstance`,
        data: instances
      };
    } catch (error) {
      return {
        success: false,
        message: '按时间范围查询TaskInstance失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 获取今日的TaskInstance
   * 
   * @returns 今日TaskInstance的响应结果
   */
  async findTodayTasks(): Promise<TResponse<TaskInstance[]>> {
    try {
      const todayTasks = this.store.getTodayTaskInstances;
      
      return {
        success: true,
        message: `找到今日 ${todayTasks.length} 个TaskInstance`,
        data: todayTasks
      };
    } catch (error) {
      return {
        success: false,
        message: '查询今日TaskInstance失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 根据目标查找相关的TaskInstance
   * 
   * 查找与指定目标关联的所有TaskInstance，用于目标进度跟踪。
   * 
   * @param goalId - 目标ID
   * @returns 与目标相关的TaskInstance响应结果
   */
  async findByGoal(goalId: string): Promise<TResponse<TaskInstance[]>> {
    try {
      const instances = this.store.getAllTaskInstances
        .filter(instance => {
          return instance.keyResultLinks?.some(link => link.goalId === goalId);
        });
      
      return {
        success: true,
        message: `找到目标 ${goalId} 相关的 ${instances.length} 个TaskInstance`,
        data: instances
      };
    } catch (error) {
      return {
        success: false,
        message: '按目标查询TaskInstance失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 删除指定ID的TaskInstance
   * 
   * @param id - 要删除的TaskInstance的ID
   * @returns 删除操作的响应结果
   */
  async delete(id: string): Promise<TResponse<boolean>> {
    const response = await this.store.removeTaskInstanceById(id);
    if (response.success) {
      await this.store.saveTaskInstances();
      return {
        success: true,
        message: response.message,
        data: true
      };
    }
    return {
      success: false,
      message: response.message,
      data: false,
      error: response.error
    };
  }

  /**
   * 更新TaskInstance
   * 
   * @param instance - 要更新的TaskInstance实例
   * @returns 更新操作的响应结果
   */
  async update(instance: TaskInstance): Promise<TResponse<TaskInstance>> {
    const response = await this.store.updateTaskInstance(instance);
    if (response.success) {
      await this.store.saveTaskInstances();
    }
    return response;
  }

  /**
   * 根据TaskTemplate查找相关的TaskInstance
   * 
   * 查找由指定TaskTemplate生成的所有TaskInstance。
   * 用于查看模板的执行历史、统计模板使用情况等。
   * 
   * @param templateId - TaskTemplate的ID
   * @returns 由指定模板生成的TaskInstance响应结果
   */
  async findByTemplateId(templateId: string): Promise<TResponse<TaskInstance[]>> {
    try {
      const instances = this.store.getAllTaskInstances
        .filter(instance => instance.templateId === templateId);
      
      return {
        success: true,
        message: `找到TaskTemplate ${templateId} 的 ${instances.length} 个TaskInstance`,
        data: instances
      };
    } catch (error) {
      return {
        success: false,
        message: '按TaskTemplate查询TaskInstance失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }
}