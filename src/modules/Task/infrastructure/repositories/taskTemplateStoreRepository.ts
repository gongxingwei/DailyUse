import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
import type { ITaskTemplateRepository } from '../../domain/repositories/iTaskTemplateRepository';
import type { TaskTemplate } from '../../domain/entities/taskTemplate';

/**
 * TaskTemplate存储库实现
 * 
 * 职责：
 * - 实现TaskTemplate的数据访问层接口
 * - 处理TaskTemplate的CRUD操作
 * - 与任务存储系统交互
 * 
 * 说明：
 * - TaskTemplate是可重复使用的任务配置模板
 * - 包含任务的基础配置、循环规则、提醒设置等
 * - 用于生成具体的TaskInstance实例
 */
export class TaskTemplateStoreRepository implements ITaskTemplateRepository {
  private store = useTaskStore();

  /**
   * 设置当前用户（Store 模式下可能不需要实际操作，但需要接口兼容）
   */
  setCurrentUser(username: string): void {
    // Store 模式下，用户隔离通过 store 的逻辑处理
    // 这里可以扩展为通知 store 当前用户变更
    console.log(`TaskTemplateStoreRepository: 设置当前用户为 ${username}`);
  }

  /**
   * 保存TaskTemplate到存储系统
   * 
   * @param template - 要保存的TaskTemplate实例
   * @returns 保存操作的响应结果
   */
  async save(template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    const response = await this.store.addTaskTemplate(template);
    if (response.success) {
      await this.store.saveTaskTemplates();
    }
    return response;
  }

  /**
   * 批量保存多个TaskTemplate
   * 
   * @param templates - 要保存的TaskTemplate数组
   * @returns 批量保存操作的响应结果
   */
  async saveAll(templates: TaskTemplate[]): Promise<TResponse<TaskTemplate[]>> {
    try {
      const responses = await Promise.all(
        templates.map(template => this.store.addTaskTemplate(template))
      );
      
      const failedResponses = responses.filter(r => !r.success);
      if (failedResponses.length > 0) {
        return {
          success: false,
          message: `批量保存失败，${failedResponses.length} 个TaskTemplate保存失败`,
          error: new Error('批量保存部分失败')
        };
      }
      
      await this.store.saveTaskTemplates();
      
      return {
        success: true,
        message: `成功保存 ${templates.length} 个TaskTemplate`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: '批量保存TaskTemplate失败',
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 根据ID查找TaskTemplate
   * 
   * @param id - TaskTemplate的唯一标识符
   * @returns 查找操作的响应结果
   */
  async findById(id: string): Promise<TResponse<TaskTemplate>> {
    try {
      const template = this.store.getTaskTemplateById(id);
      
      if (template) {
        return {
          success: true,
          message: 'TaskTemplate查询成功',
          data: template
        };
      } else {
        return {
          success: false,
          message: `未找到ID为 ${id} 的TaskTemplate`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '查询TaskTemplate失败',
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 获取所有TaskTemplate
   * 
   * @returns 所有TaskTemplate的响应结果
   */
  async findAll(): Promise<TResponse<TaskTemplate[]>> {
    try {
      const templates = this.store.getAllTaskTemplates;
      
      return {
        success: true,
        message: `找到 ${templates.length} 个TaskTemplate`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: '查询TaskTemplate列表失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 删除指定ID的TaskTemplate
   * 
   * @param id - 要删除的TaskTemplate的ID
   * @returns 删除操作的响应结果
   */
  async delete(id: string): Promise<TResponse<boolean>> {
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

  /**
   * 更新TaskTemplate
   * 
   * @param template - 要更新的TaskTemplate实例
   * @returns 更新操作的响应结果
   */
  async update(template: TaskTemplate): Promise<TResponse<TaskTemplate>> {
    const response = await this.store.updateTaskTemplate(template);
    if (response.success) {
      await this.store.saveTaskTemplates();
    }
    return response;
  }

  /**
   * 根据关键结果查找相关的TaskTemplate
   * 
   * 查找与指定目标和关键结果关联的TaskTemplate。
   * 这些TaskTemplate将用于生成支持特定目标达成的TaskInstance。
   * 
   * @param goalId - 目标ID
   * @param keyResultId - 关键结果ID
   * @returns 相关TaskTemplate的响应结果
   */
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
        message: `找到 ${templates.length} 个相关TaskTemplate`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: '查询关键结果相关TaskTemplate失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }
}