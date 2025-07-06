import type { ITaskTemplate, ITaskInstance } from '../types/task';

/**
 * 任务状态仓库接口 - 用于管理前端状态同步
 * 
 * 这是一个抽象接口，定义了状态管理的契约
 * 具体实现可以是 Pinia store、Vuex、或其他状态管理方案
 */
export interface ITaskStateRepository {
  // === 任务模板状态管理 ===
  
  /**
   * 添加任务模板到状态
   */
  addTaskTemplate(template: ITaskTemplate): Promise<void>;
  
  /**
   * 更新任务模板状态
   */
  updateTaskTemplate(template: ITaskTemplate): Promise<void>;
  
  /**
   * 从状态中删除任务模板
   */
  removeTaskTemplate(templateId: string): Promise<void>;
  
  /**
   * 批量设置任务模板
   */
  setTaskTemplates(templates: ITaskTemplate[]): Promise<void>;
  
  /**
   * 清空所有任务模板
   */
  clearAllTaskTemplates(): Promise<void>;
  
  /**
   * 根据模板ID删除相关的任务实例
   */
  removeInstancesByTemplateId(templateId: string): Promise<void>;

  // === 任务实例状态管理 ===
  
  /**
   * 添加任务实例到状态
   */
  addTaskInstance(instance: ITaskInstance): Promise<void>;
  
  /**
   * 更新任务实例状态
   */
  updateTaskInstance(instance: ITaskInstance): Promise<void>;
  
  /**
   * 从状态中删除任务实例
   */
  removeTaskInstance(instanceId: string): Promise<void>;
  
  /**
   * 批量设置任务实例
   */
  setTaskInstances(instances: ITaskInstance[]): Promise<void>;

  /**
   * 清空所有任务实例
   */
  clearAllTaskInstances(): Promise<void>;

  // === 元模板状态管理 ===
  
  /**
   * 批量设置元模板
   */
  setMetaTemplates(metaTemplates: any[]): Promise<void>;

  // === 综合状态同步 ===
  
  /**
   * 全量同步所有任务数据
   */
  syncAllTaskData(
    templates: ITaskTemplate[], 
    instances: ITaskInstance[], 
    metaTemplates: any[]
  ): Promise<void>;
  
  /**
   * 检查状态仓库是否可用
   */
  isAvailable(): boolean;
}
