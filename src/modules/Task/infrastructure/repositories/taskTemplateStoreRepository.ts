import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
import type { ITaskTemplateRepository } from '../../domain/repositories/iTaskTemplateRepository';
import type { TaskTemplate } from '../../domain/entities/taskTemplate';

export class TaskTemplateStoreRepository implements ITaskTemplateRepository {
  private store = useTaskStore();

  async save(template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    // ✅ 直接调用store方法
    const response = await this.store.addTaskTemplate(template);
    if (response.success) {
      await this.store.saveTaskTemplates();
    }
    return response;
  }

  async saveAll(templates: TaskTemplate[]): Promise<TResponse<TaskTemplate[]>> {
    try {
      // 批量添加
      const responses = await Promise.all(
        templates.map(template => this.store.addTaskTemplate(template))
      );
      
      const failedResponses = responses.filter(r => !r.success);
      if (failedResponses.length > 0) {
        return {
          success: false,
          message: `批量保存失败，${failedResponses.length} 个模板保存失败`,
          error: new Error('批量保存部分失败')
        };
      }
      
      await this.store.saveTaskTemplates();
      
      return {
        success: true,
        message: `成功保存 ${templates.length} 个任务模板`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: '批量保存任务模板失败',
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async findById(id: string): Promise<TResponse<TaskTemplate>> {
    try {
      const template = this.store.getTaskTemplateById(id);
      
      if (template) {
        return {
          success: true,
          message: '任务模板查询成功',
          data: template
        };
      } else {
        return {
          success: false,
          message: `未找到ID为 ${id} 的任务模板`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '查询任务模板失败',
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async findAll(): Promise<TResponse<TaskTemplate[]>> {
    try {
      const templates = this.store.getAllTaskTemplates;
      
      return {
        success: true,
        message: `找到 ${templates.length} 个任务模板`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: '查询任务模板列表失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async delete(id: string): Promise<TResponse<boolean>> {
    // ✅ 直接调用store方法
    const response = await this.store.removeTaskTemplateById(id);
    if (response.success) {
      await this.store.saveTaskTemplates();
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

  async update(template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    // ✅ 直接调用store方法
    const response = await this.store.updateTaskTemplate(template);
    if (response.success) {
      await this.store.saveTaskTemplates();
    }
    return response;
  }

  async findByKeyResult(goalId: string, keyResultId: string): Promise<TResponse<TaskTemplate[]>> {
    try {
      const templates = this.store.getAllTaskTemplates
        .filter(template => {
          return template.keyResultLinks?.some(
            link => link.goalId === goalId && link.keyResultId === keyResultId
          );
        });
      
      return {
        success: true,
        message: `找到 ${templates.length} 个相关任务模板`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: '查询关键结果相关任务模板失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }
}