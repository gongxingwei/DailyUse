import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
import type { ITaskMetaTemplateRepository } from '../../domain/repositories/iTaskMetaTemplateRepository';
import { TaskMetaTemplate } from '@/modules/Task/domain/entities/taskMetaTemplate';

export class TaskMetaTemplateStoreRepository implements ITaskMetaTemplateRepository {
  private store = useTaskStore();

  async save(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
    // ✅ 直接调用store方法
    return await this.store.addMetaTemplate(metaTemplate);
  }

  async findById(id: string): Promise<TResponse<TaskMetaTemplate>> {
    try {
      const metaTemplate = this.store.getMetaTemplateById(id);
      
      if (metaTemplate) {
        return {
          success: true,
          message: '元模板查询成功',
          data: metaTemplate
        };
      } else {
        return {
          success: false,
          message: `未找到ID为 ${id} 的元模板`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '查询元模板失败',
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async findAll(): Promise<TResponse<TaskMetaTemplate[]>> {
    try {
      const templates = this.store.getAllTaskMetaTemplates;
      
      return {
        success: true,
        message: `找到 ${templates.length} 个元模板`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: '查询元模板列表失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async findByCategory(category: string): Promise<TResponse<TaskMetaTemplate[]>> {
    try {
      const templates = this.store.getMetaTemplatesByCategory(category);
      
      return {
        success: true,
        message: `在分类 "${category}" 中找到 ${templates.length} 个元模板`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: `查询分类 "${category}" 的元模板失败`,
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  async delete(id: string): Promise<TResponse<boolean>> {
    // ✅ 直接调用store方法
    const response = await this.store.deleteMetaTemplateById(id);
    return {
      success: response.success,
      message: response.message,
      data: response.success,
      error: response.error
    };
  }
}