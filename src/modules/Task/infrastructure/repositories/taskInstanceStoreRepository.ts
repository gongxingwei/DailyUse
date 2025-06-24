import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
import type { ITaskInstanceRepository } from '../../domain/repositories/iTaskInstanceRepository';
import type { TaskInstance } from '../../domain/entities/taskInstance';
import type { DateTime } from '@/shared/types/myDateTime';


export class TaskInstanceStoreRepository implements ITaskInstanceRepository {
  private store = useTaskStore();

  async save(instance: TaskInstance): Promise<TResponse<TaskInstance>> {
    // ✅ 直接调用store方法
    const response = await this.store.addTaskInstance(instance);
    if (response.success) {
      await this.store.saveTaskInstances();
    }
    return response;
  }

  async saveAll(instances: TaskInstance[]): Promise<TResponse<TaskInstance[]>> {
    // ✅ 直接调用store方法
    const response = await this.store.addTaskInstances(instances);
    if (response.success) {
      await this.store.saveTaskInstances();
    }
    return response;
  }

  async findById(id: string): Promise<TResponse<TaskInstance>> {
    try {
      const instance = this.store.getTaskInstanceById(id);
      
      if (instance) {
        return {
          success: true,
          message: '任务实例查询成功',
          data: instance
        };
      } else {
        return {
          success: false,
          message: `未找到ID为 ${id} 的任务实例`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '查询任务实例失败',
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async findAll(): Promise<TResponse<TaskInstance[]>> {
    try {
      const instances = this.store.getAllTaskInstances;
      
      return {
        success: true,
        message: `找到 ${instances.length} 个任务实例`,
        data: instances
      };
    } catch (error) {
      return {
        success: false,
        message: '查询任务实例列表失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async findByDateRange(start: DateTime, end: DateTime): Promise<TResponse<TaskInstance[]>> {
    try {
      const instances = this.store.getAllTaskInstances
        .filter(instance => {
          const instanceTime = instance.scheduledTime?.timestamp || 0;
          return instanceTime >= start.timestamp && instanceTime <= end.timestamp;
        });
      
      return {
        success: true,
        message: `在指定时间范围内找到 ${instances.length} 个任务实例`,
        data: instances
      };
    } catch (error) {
      return {
        success: false,
        message: '按时间范围查询任务实例失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async findTodayTasks(): Promise<TResponse<TaskInstance[]>> {
    try {
      const todayTasks = this.store.getTodayTaskInstances;
      
      return {
        success: true,
        message: `找到今日 ${todayTasks.length} 个任务`,
        data: todayTasks
      };
    } catch (error) {
      return {
        success: false,
        message: '查询今日任务失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async findByGoal(goalId: string): Promise<TResponse<TaskInstance[]>> {
    try {
      const instances = this.store.getAllTaskInstances
        .filter(instance => {
          return instance.keyResultLinks?.some(link => link.goalId === goalId);
        });
      
      return {
        success: true,
        message: `找到目标 ${goalId} 相关的 ${instances.length} 个任务实例`,
        data: instances
      };
    } catch (error) {
      return {
        success: false,
        message: '按目标查询任务实例失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async delete(id: string): Promise<TResponse<boolean>> {
    // ✅ 直接调用store方法
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

  async update(instance: TaskInstance): Promise<TResponse<TaskInstance>> {
    // ✅ 直接调用store方法
    const response = await this.store.updateTaskInstance(instance);
    if (response.success) {
      await this.store.saveTaskInstances();
    }
    return response;
  }

  async findByTemplateId(templateId: string): Promise<TResponse<TaskInstance[]>> {
    try {
      const instances = this.store.getAllTaskInstances
        .filter(instance => instance.templateId === templateId);
      
      return {
        success: true,
        message: `找到模板 ${templateId} 的 ${instances.length} 个任务实例`,
        data: instances
      };
    } catch (error) {
      return {
        success: false,
        message: '按模板查询任务实例失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }
}