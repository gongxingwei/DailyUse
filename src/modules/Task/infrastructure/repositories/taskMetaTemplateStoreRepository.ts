import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
import type { ITaskMetaTemplateRepository } from '../../domain/repositories/iTaskMetaTemplateRepository';
import { TaskMetaTemplate } from '@/modules/Task/domain/entities/taskMetaTemplate';

/**
 * TaskMetaTemplate存储库实现
 * 
 * 职责：
 * - 实现TaskMetaTemplate的数据访问层接口
 * - 处理TaskMetaTemplate的CRUD操作
 * - 与任务存储系统交互
 * 
 * 说明：
 * - TaskMetaTemplate是任务类型的基础配置模板
 * - 用于创建TaskTemplate的默认配置
 * - 层次关系：TaskMetaTemplate -> TaskTemplate -> TaskInstance
 */
export class TaskMetaTemplateStoreRepository implements ITaskMetaTemplateRepository {
  private store = useTaskStore();

  /**
   * 设置当前用户（Store 模式下可能不需要实际操作，但需要接口兼容）
   */
  setCurrentUser(username: string): void {
    // Store 模式下，用户隔离通过 store 的逻辑处理
    // 这里可以扩展为通知 store 当前用户变更
    console.log(`TaskMetaTemplateStoreRepository: 设置当前用户为 ${username}`);
  }

  /**
   * 保存TaskMetaTemplate到存储系统
   * 
   * @param metaTemplate - 要保存的TaskMetaTemplate实例
   * @returns 保存操作的响应结果
   */
  async save(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
    return await this.store.addMetaTemplate(metaTemplate);
  }

  /**
   * 根据ID查找TaskMetaTemplate
   * 
   * @param id - TaskMetaTemplate的唯一标识符
   * @returns 查找操作的响应结果
   */
  async findById(id: string): Promise<TResponse<TaskMetaTemplate>> {
    try {
      const metaTemplate = this.store.getMetaTemplateById(id);
      
      if (metaTemplate) {
        return {
          success: true,
          message: 'TaskMetaTemplate查询成功',
          data: metaTemplate
        };
      } else {
        return {
          success: false,
          message: `未找到ID为 ${id} 的TaskMetaTemplate`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '查询TaskMetaTemplate失败',
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 获取所有TaskMetaTemplate
   * 
   * @returns 所有TaskMetaTemplate的响应结果
   */
  async findAll(): Promise<TResponse<TaskMetaTemplate[]>> {
    try {
      const templates = this.store.getAllTaskMetaTemplates;
      
      return {
        success: true,
        message: `找到 ${templates.length} 个TaskMetaTemplate`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: '查询TaskMetaTemplate列表失败',
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 根据分类查找TaskMetaTemplate
   * 
   * 按照任务分类查找相关的TaskMetaTemplate，用于创建特定类型的TaskTemplate。
   * 
   * @param category - 任务分类
   * @returns 指定分类的TaskMetaTemplate响应结果
   */
  async findByCategory(category: string): Promise<TResponse<TaskMetaTemplate[]>> {
    try {
      const templates = this.store.getMetaTemplatesByCategory(category);
      
      return {
        success: true,
        message: `在分类 "${category}" 中找到 ${templates.length} 个TaskMetaTemplate`,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        message: `查询分类 "${category}" 的TaskMetaTemplate失败`,
        data: [],
        error: error instanceof Error ? error : new Error('未知错误')
      };
    }
  }

  /**
   * 删除指定ID的TaskMetaTemplate
   * 
   * @param id - 要删除的TaskMetaTemplate的ID
   * @returns 删除操作的响应结果
   */
  async delete(id: string): Promise<TResponse<boolean>> {
    const response = await this.store.deleteMetaTemplateById(id);
    return {
      success: response.success,
      message: response.message,
      data: response.success,
      error: response.error
    };
  }
}