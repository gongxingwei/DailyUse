import { defineStore } from "pinia";
import { TaskTemplate } from "../../domain/entities/taskTemplate";
import { TaskInstance } from "../../domain/entities/taskInstance";
import { TaskMetaTemplate } from "../../domain/entities/taskMetaTemplate";
import { useStoreSave } from "@/shared/composables/useStoreSave";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
let autoSaveInstance: ReturnType<typeof useStoreSave> | null = null;

function getAutoSave() {
  if (!autoSaveInstance) {
    autoSaveInstance = useStoreSave({
      onSuccess: (storeName) => console.log(`✓ ${storeName} 数据保存成功`),
      onError: (storeName, error) =>
        console.error(`✗ ${storeName} 数据保存失败:`, error),
    });
  }
  return autoSaveInstance;
}

export function ensureTaskInstance(data: any): TaskInstance {
  if (data instanceof TaskInstance) {
    return data;
  }

  // 使用 fromCompleteData 方法完整还原实例
  return TaskInstance.fromCompleteData(data);
}

export function ensureTaskTemplate(data: any): TaskTemplate {
  if (data instanceof TaskTemplate) {
    return data;
  }

  // 使用 fromCompleteData 方法完整还原实例
  return TaskTemplate.fromCompleteData(data);
}

export function ensureTaskMetaTemplate(data: any): TaskMetaTemplate {
  if (data instanceof TaskMetaTemplate) {
    return data;
  }
  // 使用工厂方法创建实例
  return TaskMetaTemplate.fromCompleteData(data);
}

export const useTaskStore = defineStore("task", {
  state: () => ({
    taskInstances: [] as TaskInstance[],
    taskTemplates: [] as TaskTemplate[],
    metaTemplates: [] as TaskMetaTemplate[],
    taskTemplateBeingEdited: null as TaskTemplate | null,
  }),

  getters: {
    getTaskTemplateBeingEdited(state): TaskTemplate | null {
      return state.taskTemplateBeingEdited
        ? ensureTaskTemplate(state.taskTemplateBeingEdited)
        : null;
    },

    getAllTaskTemplates(): TaskTemplate[] {
      // 确保返回的都是完整的 TaskTemplate 实例
      return this.taskTemplates.map((t) => ensureTaskTemplate(t));
    },

    getAllTaskInstances(): TaskInstance[] {
      // 确保返回的都是完整的 TaskInstance 实例
      return this.taskInstances.map((i) => ensureTaskInstance(i));
    },

    getAllTaskMetaTemplates(): TaskMetaTemplate[] {
      // 确保返回的都是完整的 TaskMetaTemplate 实例
      return this.metaTemplates.map((t) => ensureTaskMetaTemplate(t));
    },

    getTaskTemplateById:
      (state) =>
      (id: string): TaskTemplate | undefined => {
        const template = state.taskTemplates.find((t) => t.id === id);
        return template ? ensureTaskTemplate(template) : undefined;
      },

    getTaskInstanceById:
      (state) =>
      (id: string): TaskInstance | undefined => {
        const instance = state.taskInstances.find((t) => t.id === id);
        return instance ? ensureTaskInstance(instance) : undefined;
      },

    getTodayTaskInstances(): TaskInstance[] {
      const today = TimeUtils.now();
      const todayStart = TimeUtils.createDateTime(
        today.date.year,
        today.date.month,
        today.date.day
      );
      const todayEnd = TimeUtils.createDateTime(
        today.date.year,
        today.date.month,
        today.date.day + 1
      );

      return this.taskInstances
        .map((i) => ensureTaskInstance(i))
        .filter((task) => {
          if (
            !task.scheduledTime ||
            typeof task.scheduledTime.timestamp !== "number"
          ) {
            return false;
          }
          return (
            task.scheduledTime.timestamp >= todayStart.timestamp &&
            task.scheduledTime.timestamp < todayEnd.timestamp
          );
        });
    },

    getAllMetaTemplates: (state): TaskMetaTemplate[] => {
      // 确保返回的都是完整的 TaskMetaTemplate 实例
      return state.metaTemplates.map((t) => ensureTaskMetaTemplate(t));
    },

    getMetaTemplateById: (state) => (id: string): TaskMetaTemplate | undefined => {
      const template = state.metaTemplates.find((t) => t.id === id);
      return template ? ensureTaskMetaTemplate(template) : undefined;
    },

    getMetaTemplatesByCategory: (state) => (category: string): TaskMetaTemplate[] => {
      return state.metaTemplates
        .filter((t) => t.category === category)
        .map((t) => ensureTaskMetaTemplate(t));
    },
  },

  actions: {
    updateTaskTemplateBeingEdited(template: TaskTemplate | null) {
      if (template) {
        this.taskTemplateBeingEdited = ensureTaskTemplate(template);
      }
      else {
        this.taskTemplateBeingEdited = null;
      }
    },
    // 当作数据库来操作
    // === 基础 CRUD 操作（确保类型安全）===
    async addTaskTemplate(template: TaskTemplate | any): Promise<TResponse<TaskTemplate>> {
      try {
        const safeTemplate = ensureTaskTemplate(template);
        this.taskTemplates.push(safeTemplate);
        return {
          success: true,
          message: "任务模板添加成功",
          data: safeTemplate,
        };
      } catch (error) {
        return {
          success: false,
          message: `添加任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    async removeTaskTemplateById(templateId: string): Promise<TResponse<void>> {
      try {
        const index = this.taskTemplates.findIndex((t) => t.id === templateId);
        if (index !== -1) {
          this.taskTemplates.splice(index, 1);
          return {
            success: true,
            message: "任务模板删除成功",
          };  
        }
        return {
          success: false,
          message: `未找到ID为 ${templateId} 的任务模板`,
        };
      } catch (error) {
        return {
          success: false,
          message: `删除任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    async updateTaskTemplate(template: TaskTemplate | any): Promise<TResponse<TaskTemplate>> {
      try {
        const safeTemplate = ensureTaskTemplate(template);
        const index = this.taskTemplates.findIndex(
          (t) => t.id === safeTemplate.id
        );
        if (index !== -1) {
          this.taskTemplates[index] = safeTemplate;
          return {
            success: true,
            message: "任务模板更新成功",
            data: safeTemplate,
          };
        }
        return {
          success: false,
          message: `未找到ID为 ${safeTemplate.id} 的任务模板`,
        };
      } catch (error) {
        return {
          success: false,
          message: `更新任务模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    async addTaskInstance(instance: TaskInstance | any): Promise<TResponse<TaskInstance>> {
      try {
        const safeInstance = ensureTaskInstance(instance);
        this.taskInstances.push(safeInstance);
        return {
          success: true,
          message: "任务实例添加成功",
          data: safeInstance,
        };
      } catch (error) {
        return {
          success: false,
          message: `添加任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    async addTaskInstances(instances: (TaskInstance | any)[]): Promise<TResponse<TaskInstance[]>> {
      try {
        const safeInstances = instances.map((i) => ensureTaskInstance(i));
        this.taskInstances.push(...safeInstances);
        return {
          success: true,
          message: `成功添加 ${safeInstances.length} 个任务实例`,
          data: safeInstances,
        };
      } catch (error) {
        return {
          success: false,
          message: `批量添加任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    async updateTaskInstance(instance: TaskInstance | any): Promise<TResponse<TaskInstance>> {
      try {
        const safeInstance = ensureTaskInstance(instance);
        const index = this.taskInstances.findIndex(
          (t) => t.id === safeInstance.id
        );
        if (index !== -1) {
          this.taskInstances[index] = safeInstance;
          return {
            success: true,
            message: "任务实例更新成功",
            data: safeInstance,
          };
        }
        return {
          success: false,
          message: `未找到ID为 ${safeInstance.id} 的任务实例`,
        };
      } catch (error) {
        return {
          success: false,
          message: `更新任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    async updateTaskInstances(instances: (TaskInstance | any)[]): Promise<TResponse<TaskInstance[]>> {
      try {
        const safeInstances = instances.map((i) => ensureTaskInstance(i));
        const updatedInstances: TaskInstance[] = [];
        
        safeInstances.forEach((instance) => {
          const index = this.taskInstances.findIndex(
            (t) => t.id === instance.id
          );
          if (index !== -1) {
            this.taskInstances[index] = instance;
            updatedInstances.push(instance);
          }
        });
        
        return {
          success: true,
          message: `成功更新 ${updatedInstances.length} 个任务实例`,
          data: updatedInstances,
        };
      } catch (error) {
        return {
          success: false,
          message: `批量更新任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    // ✅ 新增：删除单个任务实例
    async removeTaskInstanceById(instanceId: string): Promise<TResponse<void>> {
      try {
        const index = this.taskInstances.findIndex((t) => t.id === instanceId);
        if (index !== -1) {
          this.taskInstances.splice(index, 1);
          return {
            success: true,
            message: "任务实例删除成功",
          };
        }
        return {
          success: false,
          message: `未找到ID为 ${instanceId} 的任务实例`,
        };
      } catch (error) {
        return {
          success: false,
          message: `删除任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    // ✅ 新增：批量删除任务实例
    async removeTaskInstancesByIds(instanceIds: string[]): Promise<TResponse<number>> {
      try {
        let removedCount = 0;
        
        // 从后往前删除，避免索引变化问题
        for (let i = this.taskInstances.length - 1; i >= 0; i--) {
          if (instanceIds.includes(this.taskInstances[i].id)) {
            this.taskInstances.splice(i, 1);
            removedCount++;
          }
        }
        
        return {
          success: true,
          message: `成功删除 ${removedCount} 个任务实例`,
          data: removedCount,
        };
      } catch (error) {
        return {
          success: false,
          message: `批量删除任务实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    // ✅ 新增：根据模板ID删除所有相关实例
    async removeInstancesByTemplateId(templateId: string): Promise<TResponse<number>> {
      try {
        const initialCount = this.taskInstances.length;
        this.taskInstances = this.taskInstances.filter(
          (instance) => instance.templateId !== templateId
        );
        const removedCount = initialCount - this.taskInstances.length;
        
        return {
          success: true,
          message: `成功删除模板 ${templateId} 的 ${removedCount} 个相关实例`,
          data: removedCount,
        };
      } catch (error) {
        return {
          success: false,
          message: `删除模板相关实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    // ✅ 新增：根据状态删除实例
    async removeInstancesByStatus(
      status: "pending" | "inProgress" | "completed" | "cancelled" | "overdue"
    ): Promise<TResponse<number>> {
      try {
        const initialCount = this.taskInstances.length;
        this.taskInstances = this.taskInstances.filter(
          (instance) => {
            const safeInstance = ensureTaskInstance(instance);
            return safeInstance.status !== status;
          }
        );
        const removedCount = initialCount - this.taskInstances.length;
        
        return {
          success: true,
          message: `成功删除 ${removedCount} 个状态为 ${status} 的实例`,
          data: removedCount,
        };
      } catch (error) {
        return {
          success: false,
          message: `按状态删除实例失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    // ✅ 修改：MetaTemplate 相关方法
    async addMetaTemplate(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
      try {
        const safeMetaTemplate = ensureTaskMetaTemplate(metaTemplate);
        this.metaTemplates.push(safeMetaTemplate);
        await this.saveMetaTemplates();
        return {
          success: true,
          message: "元模板添加成功",
          data: safeMetaTemplate,
        };
      } catch (error) {
        return {
          success: false,
          message: `添加元模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    async updateMetaTemplate(metaTemplate: TaskMetaTemplate): Promise<TResponse<TaskMetaTemplate>> {
      try {
        const safeMetaTemplate = ensureTaskMetaTemplate(metaTemplate);
        const index = this.metaTemplates.findIndex(t => t.id === safeMetaTemplate.id);
        if (index !== -1) {
          this.metaTemplates[index] = safeMetaTemplate;
          await this.saveMetaTemplates();
          return {
            success: true,
            message: "元模板更新成功",
            data: safeMetaTemplate,
          };
        }
        return {
          success: false,
          message: `未找到ID为 ${safeMetaTemplate.id} 的元模板`,
        };
      } catch (error) {
        return {
          success: false,
          message: `更新元模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    async deleteMetaTemplateById(metaTemplateId: string): Promise<TResponse<void>> {
      try {
        const index = this.metaTemplates.findIndex(t => t.id === metaTemplateId);
        if (index !== -1) {
          this.metaTemplates.splice(index, 1);
          await this.saveMetaTemplates();
          return {
            success: true,
            message: "元模板删除成功",
          };
        }
        return {
          success: false,
          message: `未找到ID为 ${metaTemplateId} 的元模板`,
        };
      } catch (error) {
        return {
          success: false,
          message: `删除元模板失败: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
      }
    },

    /**
     * 删除元模板（别名方法）
     */
    removeMetaTemplateById(id: string): Promise<TResponse<void>> {
      return this.deleteMetaTemplateById(id);
    },

    // === 批量数据同步方法 ===
    /**
     * 批量设置任务模板（从主进程同步数据时使用）
     */
    setTaskTemplates(templates: any[]): void {
      this.taskTemplates = templates.map(template => ensureTaskTemplate(template));
    },

    /**
     * 清空所有任务模板
     */
    clearAllTaskTemplates(): void {
      this.taskTemplates = [];
      console.log('🧹 [TaskStore] 已清空所有任务模板');
    },

    /**
     * 批量设置任务实例（从主进程同步数据时使用）
     */
    setTaskInstances(instances: any[]): void {
      this.taskInstances = instances.map(instance => ensureTaskInstance(instance));
    },

    /**
     * 清空所有任务实例
     */
    clearAllTaskInstances(): void {
      this.taskInstances = [];
      console.log('🧹 [TaskStore] 已清空所有任务实例');
    },

    /**
     * 批量设置元模板（从主进程同步数据时使用）
     */
    setMetaTemplates(metaTemplates: any[]): void {
      this.metaTemplates = metaTemplates.map(meta => ensureTaskMetaTemplate(meta));
    },

    /**
     * 批量同步所有数据（从主进程同步时使用）
     */
    syncAllData(templates: any[], instances: any[], metaTemplates: any[]): void {
      console.log('🔄 [TaskStore] syncAllData 开始同步数据...');
      console.log('📊 输入数据:', { 
        templatesCount: templates.length, 
        instancesCount: instances.length, 
        metaTemplatesCount: metaTemplates.length 
      });
      
      // 直接使用 $patch 批量更新，避免重复调用
      this.$patch({
        taskTemplates: templates.map(template => ensureTaskTemplate(template)),
        taskInstances: instances.map(instance => ensureTaskInstance(instance)),
        metaTemplates: metaTemplates.map(meta => ensureTaskMetaTemplate(meta)),
      });
      
      console.log('✅ [TaskStore] syncAllData 同步完成');
      console.log('📈 最终状态:', {
        templatesCount: this.taskTemplates.length,
        instancesCount: this.taskInstances.length,
        metaTemplatesCount: this.metaTemplates.length
      });
    },

    setTaskData(templates: TaskTemplate[], instances: TaskInstance[]) {
      this.taskTemplates = templates;
      this.taskInstances = instances;
    },

    // === 数据持久化方法 ===
    // ✅ 保存模板（转换为 JSON）
    async saveTaskTemplates(): Promise<boolean> {
      const autoSave = getAutoSave();
      
      // 确保所有数据都是类实例，然后转换为 JSON
      const templatesAsJson = this.taskTemplates.map(template => {
        const safeTemplate = ensureTaskTemplate(template);
        return safeTemplate.toJSON();
      });
      
      return autoSave.debounceSave("taskTemplates", templatesAsJson);
    },

    // ✅ 保存实例（转换为 JSON）
    async saveTaskInstances(): Promise<boolean> {
      const autoSave = getAutoSave();
      
      // 确保所有数据都是类实例，然后转换为 JSON
      const instancesAsJson = this.taskInstances.map(instance => {
        const safeInstance = ensureTaskInstance(instance);
        return safeInstance.toJSON();
      });
      
      return autoSave.debounceSave("taskInstances", instancesAsJson);
    },

    // ✅ 保存所有任务数据
    async saveAllTaskData(): Promise<{
      templates: boolean;
      instances: boolean;
    }> {
      const [templatesResult, instancesResult] = await Promise.all([
        this.saveTaskTemplates(),
        this.saveTaskInstances(),
      ]);

      return {
        templates: templatesResult,
        instances: instancesResult,
      };
    },

    // ✅ 立即保存模板（转换为 JSON）
    async saveTaskTemplatesImmediately(): Promise<boolean> {
      const autoSave = getAutoSave();
      
      const templatesAsJson = this.taskTemplates.map(template => {
        const safeTemplate = ensureTaskTemplate(template);
        return safeTemplate.toJSON();
      });
      
      return autoSave.saveImmediately("taskTemplates", templatesAsJson);
    },

    // ✅ 立即保存实例（转换为 JSON）
    async saveTaskInstancesImmediately(): Promise<boolean> {
      const autoSave = getAutoSave();
      
      const instancesAsJson = this.taskInstances.map(instance => {
        const safeInstance = ensureTaskInstance(instance);
        return safeInstance.toJSON();
      });
      
      return autoSave.saveImmediately("taskInstances", instancesAsJson);
    },

    isSavingTaskTemplates(): boolean {
      const autoSave = getAutoSave();
      return autoSave.isSaving("taskTemplates");
    },

    isSavingTaskInstances(): boolean {
      const autoSave = getAutoSave();
      return autoSave.isSaving("taskInstances");
    },

    isSavingAnyTaskData(): boolean {
      const autoSave = getAutoSave();
      return autoSave.isSaving();
    },

    // === 额外的辅助方法 ===
    
    // ✅ 获取可序列化的状态快照
    getSerializableSnapshot(): {
      templates: any[];
      instances: any[];
      timestamp: number;
    } {
      return {
        templates: this.taskTemplates.map(template => {
          const safeTemplate = ensureTaskTemplate(template);
          return safeTemplate.toJSON();
        }),
        instances: this.taskInstances.map(instance => {
          const safeInstance = ensureTaskInstance(instance);
          return safeInstance.toJSON();
        }),
        timestamp: Date.now(),
      };
    },

    // ✅ 从快照恢复数据
    restoreFromSnapshot(snapshot: {
      templates: any[];
      instances: any[];
      timestamp?: number;
    }): void {
      try {
        this.taskTemplates = snapshot.templates.map(data => 
          TaskTemplate.fromCompleteData(data)
        );
        this.taskInstances = snapshot.instances.map(data => 
          TaskInstance.fromCompleteData(data)
        );
        
        console.log(`✓ 从快照恢复数据成功 (${snapshot.templates.length} 模板, ${snapshot.instances.length} 实例)`);
        if (snapshot.timestamp) {
          console.log(`✓ 快照时间: ${new Date(snapshot.timestamp).toLocaleString()}`);
        }
      } catch (error) {
        console.error('✗ 从快照恢复数据失败:', error);
        throw error;
      }
    },

    // ✅ 导出数据（用于备份）
    async exportTaskData(): Promise<string> {
      try {
        const snapshot = this.getSerializableSnapshot();
        return JSON.stringify(snapshot, null, 2);
      } catch (error) {
        console.error('✗ 导出任务数据失败:', error);
        throw error;
      }
    },

    // ✅ 导入数据（用于恢复）
    async importTaskData(jsonData: string): Promise<boolean> {
      try {
        const snapshot = JSON.parse(jsonData);
        
        // 验证数据格式
        if (!snapshot.templates || !snapshot.instances) {
          throw new Error('数据格式无效：缺少 templates 或 instances');
        }
        
        if (!Array.isArray(snapshot.templates) || !Array.isArray(snapshot.instances)) {
          throw new Error('数据格式无效：templates 和 instances 必须是数组');
        }
        
        this.restoreFromSnapshot(snapshot);
        
        // 导入后立即保存
        await this.saveAllTaskData();
        
        console.log('✓ 任务数据导入成功');
        return true;
      } catch (error) {
        console.error('✗ 导入任务数据失败:', error);
        return false;
      }
    },

    // ✅ 保存 MetaTemplates
    async saveMetaTemplates(): Promise<boolean> {
      const autoSave = getAutoSave();
      
      const metaTemplatesAsJson = this.metaTemplates.map(metaTemplate => {
        return metaTemplate.toJSON();
      });
      
      return autoSave.debounceSave("metaTemplates", metaTemplatesAsJson);
    },
  },

});
