import { defineStore } from 'pinia';
import { TaskTemplate } from '../../domain/aggregates/taskTemplate';
import { TaskInstance } from '../../domain/aggregates/taskInstance';
import { TaskMetaTemplate } from '../../domain/aggregates/taskMetaTemplate';
import { toDayStart } from '@dailyuse/utils';

export const useTaskStore = defineStore('task', {
  state: () => ({
    taskInstances: [] as TaskInstance[],
    taskTemplates: [] as TaskTemplate[],
    metaTemplates: [] as TaskMetaTemplate[],
    taskTemplateBeingEdited: null as TaskTemplate | null,
  }),

  getters: {
    getTaskTemplateBeingEdited(state): TaskTemplate | null {
      return state.taskTemplateBeingEdited as TaskTemplate | null;
    },

    getAllTaskTemplates(): TaskTemplate[] {
      return this.taskTemplates as TaskTemplate[];
    },

    getAllTaskInstances(): TaskInstance[] {
      return this.taskInstances as TaskInstance[];
    },

    getAllTaskMetaTemplates(): TaskMetaTemplate[] {
      return this.metaTemplates as TaskMetaTemplate[];
    },

    getTaskTemplateById:
      (state) =>
      (uuid: string): TaskTemplate | undefined => {
        const template = state.taskTemplates.find((t) => t.uuid === uuid);
        return template as TaskTemplate | undefined;
      },

    getTaskInstanceById:
      (state) =>
      (uuid: string): TaskInstance | undefined => {
        const instance = state.taskInstances.find((t) => t.uuid === uuid);
        return instance as TaskInstance | undefined;
      },

    getTodayTaskInstances(): TaskInstance[] {
      console.log(
        '🔍 [TaskStore] 获取今日任务实例！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！',
      );
      console.log('当前任务实例列表:', this.taskInstances);
      const today = new Date();
      const todayStart = toDayStart(today);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayStart.getDate() + 1);
      const todayInstance = (this.taskInstances as TaskInstance[]).filter((task) => {
        if (
          !task.timeConfig.scheduledTime ||
          typeof task.timeConfig.scheduledTime.getTime() !== 'number'
        ) {
          return false;
        }
        return (
          task.timeConfig.scheduledTime.getTime() >= todayStart.getTime() &&
          task.timeConfig.scheduledTime.getTime() < todayEnd.getTime()
        );
      });
      console.log('📅 今日任务实例:', todayInstance);
      return todayInstance;
    },

    getAllMetaTemplates: (state): TaskMetaTemplate[] => {
      return state.metaTemplates as TaskMetaTemplate[];
    },

    getMetaTemplateByUuid:
      (state) =>
      (uuid: string): TaskMetaTemplate | undefined => {
        const template = state.metaTemplates.find((t) => t.uuid === uuid);
        return template as TaskMetaTemplate | undefined;
      },

    getMetaTemplatesByCategory:
      (state) =>
      (category: string): TaskMetaTemplate[] => {
        return (state.metaTemplates as TaskMetaTemplate[]).filter((t) => t.category === category);
      },
  },

  actions: {
    getTaskTemplatesByKeyResultUuid(keyResultUuid: string): TaskTemplate[] {
      const templates = this.taskTemplates.filter((t) => {
        if (!t.keyResultLinks || t.keyResultLinks.length === 0) {
          return false;
        }
        return t.keyResultLinks.some((link) => link.keyResultId === keyResultUuid);
      });
      return templates as TaskTemplate[];
    },
    updateTaskTemplateBeingEdited(template: TaskTemplate | null) {
      this.taskTemplateBeingEdited = template as TaskTemplate | null;
    },
    // 当作数据库来操作
    // === 基础 CRUD 操作（确保类型安全）===
    async addTaskTemplate(template: TaskTemplate | any): Promise<ApiResponse<TaskTemplate>> {
      this.taskTemplates.push(template as TaskTemplate);
      return {
        success: true,
        message: '任务模板添加成功',
        data: template as TaskTemplate,
      };
    },

    async removeTaskTemplateById(templateId: string): Promise<ApiResponse<void>> {
      const index = this.taskTemplates.findIndex((t) => t.uuid === templateId);
      if (index !== -1) {
        this.taskTemplates.splice(index, 1);
        return {
          success: true,
          message: '任务模板删除成功',
        };
      }
      return {
        success: false,
        message: `未找到ID为 ${templateId} 的任务模板`,
      };
    },

    async updateTaskTemplate(template: TaskTemplate | any): Promise<ApiResponse<TaskTemplate>> {
      const index = this.taskTemplates.findIndex((t) => t.uuid === (template as TaskTemplate).uuid);
      if (index !== -1) {
        this.taskTemplates[index] = template as TaskTemplate;
        return {
          success: true,
          message: '任务模板更新成功',
          data: template as TaskTemplate,
        };
      }
      return {
        success: false,
        message: `未找到ID为 ${(template as TaskTemplate).uuid} 的任务模板`,
      };
    },

    async addTaskInstance(instance: TaskInstance | any): Promise<ApiResponse<TaskInstance>> {
      this.taskInstances.push(instance as TaskInstance);
      return {
        success: true,
        message: '任务实例添加成功',
        data: instance as TaskInstance,
      };
    },

    async addTaskInstances(
      instances: (TaskInstance | any)[],
    ): Promise<ApiResponse<TaskInstance[]>> {
      this.taskInstances.push(...(instances as TaskInstance[]));
      return {
        success: true,
        message: `成功添加 ${(instances as TaskInstance[]).length} 个任务实例`,
        data: instances as TaskInstance[],
      };
    },

    async updateTaskInstance(instance: TaskInstance | any): Promise<ApiResponse<TaskInstance>> {
      const index = this.taskInstances.findIndex((t) => t.uuid === (instance as TaskInstance).uuid);
      if (index !== -1) {
        this.taskInstances[index] = instance as TaskInstance;
        return {
          success: true,
          message: '任务实例更新成功',
          data: instance as TaskInstance,
        };
      }
      return {
        success: false,
        message: `未找到ID为 ${(instance as TaskInstance).uuid} 的任务实例`,
      };
    },

    async updateTaskInstances(
      instances: (TaskInstance | any)[],
    ): Promise<ApiResponse<TaskInstance[]>> {
      const updatedInstances: TaskInstance[] = [];
      (instances as TaskInstance[]).forEach((instance) => {
        const index = this.taskInstances.findIndex((t) => t.uuid === instance.uuid);
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
    },

    // ✅ 新增：删除单个任务实例
    async removeTaskInstanceById(instanceId: string): Promise<ApiResponse<void>> {
      const index = this.taskInstances.findIndex((t) => t.uuid === instanceId);
      if (index !== -1) {
        this.taskInstances.splice(index, 1);
        return {
          success: true,
          message: '任务实例删除成功',
        };
      }
      return {
        success: false,
        message: `未找到ID为 ${instanceId} 的任务实例`,
      };
    },

    // ✅ 新增：批量删除任务实例
    async removeTaskInstancesByIds(instanceIds: string[]): Promise<ApiResponse<number>> {
      let removedCount = 0;

      // 从后往前删除，避免索引变化问题
      for (let i = this.taskInstances.length - 1; i >= 0; i--) {
        if (instanceIds.includes(this.taskInstances[i].uuid)) {
          this.taskInstances.splice(i, 1);
          removedCount++;
        }
      }

      return {
        success: true,
        message: `成功删除 ${removedCount} 个任务实例`,
        data: removedCount,
      };
    },

    // ✅ 新增：根据模板ID删除所有相关实例
    async removeInstancesByTemplateId(templateId: string): Promise<ApiResponse<number>> {
      const initialCount = this.taskInstances.length;
      this.taskInstances = this.taskInstances.filter(
        (instance) => (instance as TaskInstance).templateUuid !== templateId,
      );
      const removedCount = initialCount - this.taskInstances.length;

      return {
        success: true,
        message: `成功删除模板 ${templateId} 的 ${removedCount} 个相关实例`,
        data: removedCount,
      };
    },

    // ✅ 新增：根据状态删除实例
    async removeInstancesByStatus(
      status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue',
    ): Promise<ApiResponse<number>> {
      const initialCount = this.taskInstances.length;
      this.taskInstances = this.taskInstances.filter((instance) => {
        return (instance as TaskInstance).status !== status;
      });
      const removedCount = initialCount - this.taskInstances.length;

      return {
        success: true,
        message: `成功删除 ${removedCount} 个状态为 ${status} 的实例`,
        data: removedCount,
      };
    },

    // ✅ 修改：MetaTemplate 相关方法
    async addMetaTemplate(metaTemplate: TaskMetaTemplate): Promise<ApiResponse<TaskMetaTemplate>> {
      this.metaTemplates.push(metaTemplate as TaskMetaTemplate);
      return {
        success: true,
        message: '元模板添加成功',
        data: metaTemplate as TaskMetaTemplate,
      };
    },

    async deleteMetaTemplateById(metaTemplateId: string): Promise<ApiResponse<void>> {
      const index = this.metaTemplates.findIndex((t) => t.uuid === metaTemplateId);
      if (index !== -1) {
        this.metaTemplates.splice(index, 1);
        return {
          success: true,
          message: '元模板删除成功',
        };
      }
      return {
        success: false,
        message: `未找到ID为 ${metaTemplateId} 的元模板`,
      };
    },

    // === 批量数据同步方法 ===
    /**
     * 批量设置任务模板（从主进程同步数据时使用）
     */
    setTaskTemplates(templates: any[]): void {
      this.taskTemplates = templates as TaskTemplate[];
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
      this.taskInstances = instances as TaskInstance[];
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
      this.metaTemplates = metaTemplates as TaskMetaTemplate[];
    },

    /**
     * 批量同步所有数据（从主进程同步时使用）
     */
    syncAllData(templates: any[], instances: any[], metaTemplates: any[]): void {
      console.log('🔄 [TaskStore] syncAllData 开始同步数据...');
      console.log('📊 输入数据:', {
        templatesCount: templates.length,
        instancesCount: instances.length,
        metaTemplatesCount: metaTemplates.length,
      });

      // 直接使用 $patch 批量更新，避免重复调用
      this.$patch({
        taskTemplates: templates as TaskTemplate[],
        taskInstances: instances as TaskInstance[],
        metaTemplates: metaTemplates as TaskMetaTemplate[],
      });

      console.log('✅ [TaskStore] syncAllData 同步完成');
      console.log('📈 最终状态:', {
        templatesCount: this.taskTemplates.length,
        instancesCount: this.taskInstances.length,
        metaTemplatesCount: this.metaTemplates.length,
      });
    },

    setTaskData(templates: TaskTemplate[], instances: TaskInstance[]) {
      this.taskTemplates = templates;
      this.taskInstances = instances;
    },

    // ✅ 获取可序列化的状态快照
    getSerializableSnapshot(): {
      templates: any[];
      instances: any[];
      timestamp: number;
    } {
      return {
        templates: (this.taskTemplates as TaskTemplate[]).map((template) => template.toDTO()),
        instances: (this.taskInstances as TaskInstance[]).map((instance) => instance.toDTO()),
        timestamp: Date.now(),
      };
    },

    // ✅ 从快照恢复数据
    restoreFromSnapshot(snapshot: {
      templates: any[];
      instances: any[];
      timestamp?: number;
    }): void {
      this.taskTemplates = snapshot.templates.map((data) => TaskTemplate.fromDTO(data));
      this.taskInstances = snapshot.instances.map((data) => TaskInstance.fromDTO(data));
      console.log(
        `✓ 从快照恢复数据成功 (${snapshot.templates.length} 模板, ${snapshot.instances.length} 实例)`,
      );
      if (snapshot.timestamp) {
        console.log(`✓ 快照时间: ${new Date(snapshot.timestamp).toLocaleString()}`);
      }
    },
  },
});
