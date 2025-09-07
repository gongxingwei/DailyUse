import type { ITaskStateRepository } from '@renderer/modules/Task/domain/repositories/ITaskStateRepository';
import type { ITaskTemplate, ITaskInstance } from '@common/modules/task/types/task';
import { useTaskStore } from '@renderer/modules/Task/presentation/stores/taskStore';

/**
 * 基于 Pinia Store 的任务状态仓库实现
 * 
 * 这是 ITaskStateRepository 接口的具体实现
 * 将抽象的状态管理操作映射到 Pinia store 的具体方法
 */
export class PiniaTaskStateRepository implements ITaskStateRepository {
  private _taskStore: ReturnType<typeof useTaskStore> | null = null;

  /**
   * 延迟获取 taskStore，确保 Pinia 已经初始化
   */
  private get taskStore() {
    if (!this._taskStore) {
      this._taskStore = useTaskStore();
    }
    return this._taskStore;
  }

  // === 任务模板状态管理 ===
  
  async addTaskTemplate(template: ITaskTemplate): Promise<void> {
    try {
      await this.taskStore.addTaskTemplate(template);
      console.log(`✅ [StateRepo] 添加任务模板到状态: ${template.uuid}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 添加任务模板失败: ${template.uuid}`, error);
      throw error;
    }
  }
  
  async updateTaskTemplate(template: ITaskTemplate): Promise<void> {
    try {
      await this.taskStore.updateTaskTemplate(template);
      console.log(`✅ [StateRepo] 更新任务模板状态: ${template.uuid}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 更新任务模板失败: ${template.uuid}`, error);
      throw error;
    }
  }
  
  async removeTaskTemplate(templateId: string): Promise<void> {
    try {
      await this.taskStore.removeTaskTemplateById(templateId);
      console.log(`✅ [StateRepo] 从状态删除任务模板: ${templateId}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 删除任务模板失败: ${templateId}`, error);
      throw error;
    }
  }
  
  async setTaskTemplates(templates: ITaskTemplate[]): Promise<void> {
    try {
      this.taskStore.setTaskTemplates(templates);
      console.log(`✅ [StateRepo] 设置任务模板状态: ${templates.length} 个`);
    } catch (error) {
      console.error('❌ [StateRepo] 设置任务模板失败', error);
      throw error;
    }
  }
  
  async clearAllTaskTemplates(): Promise<void> {
    try {
      this.taskStore.clearAllTaskTemplates();
      console.log('✅ [StateRepo] 清空所有任务模板状态');
    } catch (error) {
      console.error('❌ [StateRepo] 清空任务模板失败', error);
      throw error;
    }
  }
  
  async removeInstancesByTemplateId(templateId: string): Promise<void> {
    try {
      await this.taskStore.removeInstancesByTemplateId(templateId);
      console.log(`✅ [StateRepo] 删除模板相关实例: ${templateId}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 删除模板相关实例失败: ${templateId}`, error);
      throw error;
    }
  }

  // === 任务实例状态管理 ===
  
  async addTaskInstance(instance: ITaskInstance): Promise<void> {
    try {
      await this.taskStore.addTaskInstance(instance);
      console.log(`✅ [StateRepo] 添加任务实例到状态: ${instance.uuid}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 添加任务实例失败: ${instance.uuid}`, error);
      throw error;
    }
  }
  
  async updateTaskInstance(instance: ITaskInstance): Promise<void> {
    try {
      await this.taskStore.updateTaskInstance(instance);
      console.log(`✅ [StateRepo] 更新任务实例状态: ${instance.uuid}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 更新任务实例失败: ${instance.uuid}`, error);
      throw error;
    }
  }
  
  async removeTaskInstance(instanceId: string): Promise<void> {
    try {
      await this.taskStore.removeTaskInstanceById(instanceId);
      console.log(`✅ [StateRepo] 从状态删除任务实例: ${instanceId}`);
    } catch (error) {
      console.error(`❌ [StateRepo] 删除任务实例失败: ${instanceId}`, error);
      throw error;
    }
  }
  
  async setTaskInstances(instances: ITaskInstance[]): Promise<void> {
    try {
      this.taskStore.setTaskInstances(instances);
      console.log(`✅ [StateRepo] 设置任务实例状态: ${instances.length} 个`);
    } catch (error) {
      console.error('❌ [StateRepo] 设置任务实例失败', error);
      throw error;
    }
  }

  async clearAllTaskInstances(): Promise<void> {
    try {
      this.taskStore.clearAllTaskInstances();
      console.log('✅ [StateRepo] 清空所有任务实例状态');
    } catch (error) {
      console.error('❌ [StateRepo] 清空任务实例失败', error);
      throw error;
    }
  }

  // === 元模板状态管理 ===
  
  async setMetaTemplates(metaTemplates: any[]): Promise<void> {
    try {
      this.taskStore.setMetaTemplates(metaTemplates);
      console.log(`✅ [StateRepo] 设置元模板状态: ${metaTemplates.length} 个`);
    } catch (error) {
      console.error('❌ [StateRepo] 设置元模板失败', error);
      throw error;
    }
  }

  async getMetaTemplateByUuid(uuid: string): Promise<any | null> {
    try {
      const metaTemplate = this.taskStore.getMetaTemplateByUuid(uuid);
      console.log(`✅ [StateRepo] 获取元模板状态: ${uuid}`);
      return metaTemplate;
    } catch (error) {
      console.error('❌ [StateRepo] 获取元模板失败', error);
      return null;
    }
  }

  // === 综合状态同步 ===
  
  async syncAllTaskData(
    templates: ITaskTemplate[], 
    instances: ITaskInstance[], 
    metaTemplates: any[]
  ): Promise<void> {
    try {
      this.taskStore.syncAllData(templates, instances, metaTemplates);
      console.log(`✅ [StateRepo] 全量同步任务数据: ${templates.length} 模板, ${instances.length} 实例, ${metaTemplates.length} 元模板`);
    } catch (error) {
      console.error('❌ [StateRepo] 全量同步失败', error);
      throw error;
    }
  }
  
  isAvailable(): boolean {
    try {
      // 简单检查 store 是否可用
      return this.taskStore !== null && this.taskStore !== undefined;
    } catch (error) {
      console.error('❌ [StateRepo] 状态仓库不可用', error);
      return false;
    }
  }
}
