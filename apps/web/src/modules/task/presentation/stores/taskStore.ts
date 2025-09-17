import { defineStore } from 'pinia';
import { TaskTemplate, TaskInstance, TaskMetaTemplate } from '@dailyuse/domain-client';
import { toDayStart } from '@dailyuse/utils';

/**
 * Task Store - 新架构
 * 纯缓存存储，不直接调用外部服务
 * 所有数据操作通过 ApplicationService 进行
 */
export const useTaskStore = defineStore('task', {
  state: () => ({
    // ===== 核心数据 =====
    taskTemplates: [] as any[],
    taskInstances: [] as any[],
    metaTemplates: [] as any[],

    // ===== 状态管理 =====
    isLoading: false,
    error: null as string | null,
    isInitialized: false /**
     * @deprecated 使用 getTaskTemplateByUuid 替代
     */,
    getTaskTemplateById(uuid: string) {
      console.warn('[TaskStore] getTaskTemplateById 已废弃，请使用 getTaskTemplateByUuid');
      return this.taskTemplates.find((t) => t.uuid === uuid) || null;
    }, // ===== UI 状态 =====
    selectedTaskTemplate: null as string | null,
    selectedTaskInstance: null as string | null,
    taskTemplateBeingEdited: null as any | null,

    // ===== 分页信息 =====
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },

    // ===== 缓存管理 =====
    lastSyncTime: null as Date | null,
    cacheExpiry: 5 * 60 * 1000, // 5分钟过期
  }),

  getters: {
    // ===== 基础获取器 =====

    /**
     * 获取所有任务模板
     */
    getAllTaskTemplates(state): any[] {
      return state.taskTemplates;
    },

    /**
     * 获取所有任务实例
     */
    getAllTaskInstances(state): any[] {
      return state.taskInstances;
    },

    /**
     * 获取所有元模板
     */
    getAllTaskMetaTemplates(state): any[] {
      return state.metaTemplates;
    },

    /**
     * 根据UUID获取任务模板
     */
    getTaskTemplateByUuid:
      (state) =>
      (uuid: string): any | null => {
        return state.taskTemplates.find((t) => t.uuid === uuid) || null;
      },

    /**
     * 根据UUID获取任务实例
     */
    getTaskInstanceByUuid:
      (state) =>
      (uuid: string): any | null => {
        return state.taskInstances.find((t) => t.uuid === uuid) || null;
      },

    /**
     * 根据UUID获取元模板
     */
    getMetaTemplateByUuid:
      (state) =>
      (uuid: string): any | null => {
        return state.metaTemplates.find((t) => t.uuid === uuid) || null;
      },

    // ===== 选中状态 =====

    /**
     * 获取当前选中的任务模板
     */
    getSelectedTaskTemplate(state): any | null {
      if (!state.selectedTaskTemplate) return null;
      return state.taskTemplates.find((t) => t.uuid === state.selectedTaskTemplate) || null;
    },

    /**
     * 获取当前选中的任务实例
     */
    getSelectedTaskInstance(state): any | null {
      if (!state.selectedTaskInstance) return null;
      return state.taskInstances.find((t) => t.uuid === state.selectedTaskInstance) || null;
    },

    /**
     * 获取正在编辑的任务模板
     */
    getTaskTemplateBeingEdited(state): any | null {
      return state.taskTemplateBeingEdited;
    },

    // ===== 业务逻辑获取器 =====

    /**
     * 获取今日任务实例
     */
    getTodayTaskInstances(state): any[] {
      const today = new Date();
      const todayStart = toDayStart(today);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayStart.getDate() + 1);

      return state.taskInstances.filter((task) => {
        if (!task.timeConfig?.scheduledDate) return false;
        const scheduledDate = new Date(task.timeConfig?.scheduledDate);
        return (
          scheduledDate.getTime() >= todayStart.getTime() &&
          scheduledDate.getTime() < todayEnd.getTime()
        );
      });
    },

    /**
     * 根据关键结果UUID获取任务模板
     */
    getTaskTemplatesByKeyResultUuid:
      (state) =>
      (keyResultUuid: string): any[] => {
        return state.taskTemplates.filter((t) => {
          if (!t.goalLinks || t.goalLinks.length === 0) return false;
          return t.goalLinks.some((link: any) => link.keyResultId === keyResultUuid);
        });
      },

    /**
     * 根据分类获取元模板
     */
    getMetaTemplatesByCategory:
      (state) =>
      (category: string): any[] => {
        return state.metaTemplates.filter((t) => t.appearance?.category === category);
      },

    /**
     * 根据模板UUID获取任务实例
     */
    getInstancesByTemplateUuid:
      (state) =>
      (templateUuid: string): any[] => {
        return state.taskInstances.filter((instance) => instance.templateUuid === templateUuid);
      },

    /**
     * 根据状态获取任务实例
     */
    getInstancesByStatus:
      (state) =>
      (status: string): any[] => {
        return state.taskInstances.filter((instance) => instance.execution?.status === status);
      },

    // ===== 统计信息 =====

    /**
     * 任务模板统计
     */
    getTaskTemplateStatistics(state): {
      total: number;
      active: number;
      archived: number;
    } {
      const total = state.taskTemplates.length;
      const active = state.taskTemplates.filter((t) => t.lifecycle?.status === 'active').length;
      const archived = state.taskTemplates.filter((t) => t.lifecycle?.status === 'archived').length;

      return { total, active, archived };
    },

    /**
     * 任务实例统计
     */
    getTaskInstanceStatistics(state): {
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
      cancelled: number;
      overdue: number;
    } {
      const total = state.taskInstances.length;
      const pending = state.taskInstances.filter((i) => i.execution?.status === 'pending').length;
      const inProgress = state.taskInstances.filter(
        (i) => i.execution?.status === 'inProgress',
      ).length;
      const completed = state.taskInstances.filter(
        (i) => i.execution?.status === 'completed',
      ).length;
      const cancelled = state.taskInstances.filter(
        (i) => i.execution?.status === 'cancelled',
      ).length;
      const overdue = state.taskInstances.filter((i) => i.execution?.status === 'overdue').length;

      return { total, pending, inProgress, completed, cancelled, overdue };
    },

    /**
     * 元模板统计
     */
    getMetaTemplateStatistics(state): {
      total: number;
      byCategory: Record<string, number>;
    } {
      const total = state.metaTemplates.length;
      const byCategory: Record<string, number> = {};

      state.metaTemplates.forEach((template) => {
        const category = template.appearance?.category || 'uncategorized';
        byCategory[category] = (byCategory[category] || 0) + 1;
      });

      return { total, byCategory };
    },

    // ===== 缓存管理 =====

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(state): boolean {
      if (!state.lastSyncTime) return true;
      const now = new Date();
      const timeDiff = now.getTime() - state.lastSyncTime.getTime();
      return timeDiff > state.cacheExpiry;
    },
  },

  actions: {
    // ===== 状态管理 =====

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * 标记为已初始化
     */
    setInitialized(initialized: boolean) {
      this.isInitialized = initialized;
    },

    /**
     * 更新最后同步时间
     */
    updateLastSyncTime() {
      this.lastSyncTime = new Date();
    },

    /**
     * 设置分页信息
     */
    setPagination(pagination: { page: number; limit: number; total: number }) {
      this.pagination = { ...pagination };
    },

    // ===== 选中状态管理 =====

    /**
     * 设置选中的任务模板
     */
    setSelectedTaskTemplate(uuid: string | null) {
      this.selectedTaskTemplate = uuid;
    },

    /**
     * 设置选中的任务实例
     */
    setSelectedTaskInstance(uuid: string | null) {
      this.selectedTaskInstance = uuid;
    },

    /**
     * 设置正在编辑的任务模板
     */
    setTaskTemplateBeingEdited(template: any | null) {
      this.taskTemplateBeingEdited = template;
    },

    // ===== 数据同步方法（由 ApplicationService 调用）=====

    /**
     * 批量设置任务模板
     */
    setTaskTemplates(templates: any[]) {
      this.taskTemplates = [...templates];
      console.log(`✅ [TaskStore] 已设置 ${templates.length} 个任务模板`);
    },

    /**
     * 批量设置任务实例
     */
    setTaskInstances(instances: any[]) {
      this.taskInstances = [...instances];
      console.log(`✅ [TaskStore] 已设置 ${instances.length} 个任务实例`);
    },

    /**
     * 批量设置元模板
     */
    setMetaTemplates(metaTemplates: any[]) {
      this.metaTemplates = [...metaTemplates];
      console.log(`✅ [TaskStore] 已设置 ${metaTemplates.length} 个元模板`);
    },

    /**
     * 添加单个任务模板到缓存
     */
    addTaskTemplate(template: any) {
      const existingIndex = this.taskTemplates.findIndex((t) => t.uuid === template.uuid);
      if (existingIndex >= 0) {
        this.taskTemplates[existingIndex] = template;
      } else {
        this.taskTemplates.push(template);
      }
    },

    /**
     * 添加单个任务实例到缓存
     */
    addTaskInstance(instance: any) {
      const existingIndex = this.taskInstances.findIndex((i) => i.uuid === instance.uuid);
      if (existingIndex >= 0) {
        this.taskInstances[existingIndex] = instance;
      } else {
        this.taskInstances.push(instance);
      }
    },

    /**
     * 添加多个任务实例到缓存
     */
    addTaskInstances(instances: any[]) {
      instances.forEach((instance) => {
        this.addTaskInstance(instance);
      });
    },

    /**
     * 添加单个元模板到缓存
     */
    addMetaTemplate(metaTemplate: any) {
      const existingIndex = this.metaTemplates.findIndex((t) => t.uuid === metaTemplate.uuid);
      if (existingIndex >= 0) {
        this.metaTemplates[existingIndex] = metaTemplate;
      } else {
        this.metaTemplates.push(metaTemplate);
      }
    },

    /**
     * 更新任务模板
     */
    updateTaskTemplate(uuid: string, updatedTemplate: any) {
      const index = this.taskTemplates.findIndex((t) => t.uuid === uuid);
      if (index >= 0) {
        this.taskTemplates[index] = updatedTemplate;
      }
    },

    /**
     * 更新任务实例
     */
    updateTaskInstance(uuid: string, updatedInstance: any) {
      const index = this.taskInstances.findIndex((i) => i.uuid === uuid);
      if (index >= 0) {
        this.taskInstances[index] = updatedInstance;
      }
    },

    /**
     * 批量更新任务实例
     */
    updateTaskInstances(instances: any[]) {
      instances.forEach((instance) => {
        this.updateTaskInstance(instance.uuid, instance);
      });
    },

    /**
     * 更新元模板
     */
    updateMetaTemplate(uuid: string, updatedTemplate: any) {
      const index = this.metaTemplates.findIndex((t) => t.uuid === uuid);
      if (index >= 0) {
        this.metaTemplates[index] = updatedTemplate;
      }
    },

    /**
     * 移除任务模板
     */
    removeTaskTemplate(uuid: string) {
      const index = this.taskTemplates.findIndex((t) => t.uuid === uuid);
      if (index >= 0) {
        this.taskTemplates.splice(index, 1);

        // 如果删除的是当前选中的模板，清除选中状态
        if (this.selectedTaskTemplate === uuid) {
          this.selectedTaskTemplate = null;
        }

        // 如果删除的是正在编辑的模板，清除编辑状态
        if (this.taskTemplateBeingEdited?.uuid === uuid) {
          this.taskTemplateBeingEdited = null;
        }
      }
    },

    /**
     * 移除任务实例
     */
    removeTaskInstance(uuid: string) {
      const index = this.taskInstances.findIndex((i) => i.uuid === uuid);
      if (index >= 0) {
        this.taskInstances.splice(index, 1);

        // 如果删除的是当前选中的实例，清除选中状态
        if (this.selectedTaskInstance === uuid) {
          this.selectedTaskInstance = null;
        }
      }
    },

    /**
     * 批量移除任务实例
     */
    removeTaskInstancesByIds(uuids: string[]) {
      this.taskInstances = this.taskInstances.filter((instance) => !uuids.includes(instance.uuid));

      // 如果删除的包含当前选中的实例，清除选中状态
      if (this.selectedTaskInstance && uuids.includes(this.selectedTaskInstance)) {
        this.selectedTaskInstance = null;
      }
    },

    /**
     * 根据模板UUID移除相关实例
     */
    removeInstancesByTemplateUuid(templateUuid: string) {
      this.taskInstances = this.taskInstances.filter(
        (instance) => instance.templateUuid !== templateUuid,
      );
    },

    /**
     * 移除元模板
     */
    removeMetaTemplate(uuid: string) {
      const index = this.metaTemplates.findIndex((t) => t.uuid === uuid);
      if (index >= 0) {
        this.metaTemplates.splice(index, 1);
      }
    },

    // ===== 初始化和清理 =====

    /**
     * 初始化 Store
     */
    initialize(): void {
      this.isInitialized = true;
      console.log(
        `✅ [TaskStore] 初始化完成: ${this.taskTemplates.length} 个模板，${this.taskInstances.length} 个实例，${this.metaTemplates.length} 个元模板`,
      );
    },

    // ===== 缓存管理 =====
    // 注意：缓存管理现在由 pinia-plugin-persistedstate 自动处理

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(): boolean {
      if (!this.lastSyncTime) return true;

      // 如果超过30分钟未同步，则需要刷新
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return this.lastSyncTime < thirtyMinutesAgo;
    },

    /**
     * 清除所有数据
     */
    clearAll() {
      this.taskTemplates = [];
      this.taskInstances = [];
      this.metaTemplates = [];
      this.selectedTaskTemplate = null;
      this.selectedTaskInstance = null;
      this.taskTemplateBeingEdited = null;
      this.lastSyncTime = null;
      this.error = null;
      this.isInitialized = false;

      console.log('🧹 [TaskStore] 已清除所有数据');
    },

    /**
     * @deprecated 使用 clearAll 替代
     */
    clearAllData() {
      console.warn('[TaskStore] clearAllData 已废弃，请使用 clearAll');
      this.clearAll();
    },

    /**
     * 批量同步所有数据
     */
    syncAllData(templates: any[], instances: any[], metaTemplates: any[]) {
      this.setTaskTemplates(templates);
      this.setTaskInstances(instances);
      this.setMetaTemplates(metaTemplates);
      this.updateLastSyncTime();

      console.log('🔄 [TaskStore] 批量同步完成');
    },

    // ===== 兼容性方法（保持向后兼容）=====

    /**
     * @deprecated 使用 getTaskTemplateByUuid 替代
     */
    getTaskTemplateById(uuid: string) {
      console.warn('[TaskStore] getTaskTemplateById 已废弃，请使用 getTaskTemplateByUuid');
      return this.taskTemplates.find((t) => t.uuid === uuid) || null;
    },

    /**
     * @deprecated 使用 getTaskInstanceByUuid 替代
     */
    getTaskInstanceById(uuid: string) {
      console.warn('[TaskStore] getTaskInstanceById 已废弃，请使用 getTaskInstanceByUuid');
      return this.taskInstances.find((i) => i.uuid === uuid) || null;
    },

    /**
     * 兼容旧方法：设置任务数据
     */
    setTaskData(templates: any[], instances: any[]) {
      this.setTaskTemplates(templates);
      this.setTaskInstances(instances);
    },

    /**
     * 获取可序列化的状态快照
     */
    getSerializableSnapshot() {
      return {
        templates: [...this.taskTemplates],
        instances: [...this.taskInstances],
        metaTemplates: [...this.metaTemplates],
        timestamp: Date.now(),
      };
    },

    /**
     * 从快照恢复数据
     */
    restoreFromSnapshot(snapshot: {
      templates: any[];
      instances: any[];
      metaTemplates?: any[];
      timestamp?: number;
    }) {
      this.setTaskTemplates(snapshot.templates);
      this.setTaskInstances(snapshot.instances);
      if (snapshot.metaTemplates) {
        this.setMetaTemplates(snapshot.metaTemplates);
      }
      this.updateLastSyncTime();

      console.log(`✅ [TaskStore] 从快照恢复数据成功`);
    },
  },

  persist: {
    key: 'task-store',
    storage: localStorage,
    // 选择性持久化关键数据，避免持久化加载状态
    pick: [
      'taskTemplates',
      'taskInstances',
      'metaTemplates',
      'selectedTaskTemplate',
      'selectedTaskInstance',
      'lastSyncTime',
      'isInitialized',
    ],

    // 自定义序列化器，处理Date对象和Domain实体
    serializer: {
      serialize: (value: any) => {
        try {
          // 处理需要序列化的数据
          const serializedValue = {
            ...value,
            // 将Date转换为ISO字符串
            lastSyncTime: value.lastSyncTime ? value.lastSyncTime.toISOString() : null,

            // 将Domain实体转换为DTO
            taskTemplates:
              value.taskTemplates?.map((template: any) =>
                template && typeof template.toDTO === 'function' ? template.toDTO() : template,
              ) || [],

            taskInstances:
              value.taskInstances?.map((instance: any) =>
                instance && typeof instance.toDTO === 'function' ? instance.toDTO() : instance,
              ) || [],

            metaTemplates:
              value.metaTemplates?.map((metaTemplate: any) =>
                metaTemplate && typeof metaTemplate.toDTO === 'function'
                  ? metaTemplate.toDTO()
                  : metaTemplate,
              ) || [],
          };

          return JSON.stringify(serializedValue);
        } catch (error) {
          console.error('TaskStore 序列化失败:', error);
          return JSON.stringify({});
        }
      },

      deserialize: (value: string) => {
        try {
          const parsed = JSON.parse(value);

          return {
            ...parsed,
            // 恢复Date对象
            lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null,

            // 将DTO转换回Domain实体（当实体类可用时）
            taskTemplates:
              parsed.taskTemplates?.map((templateDTO: any) => {
                if (templateDTO && typeof TaskTemplate?.fromDTO === 'function') {
                  return TaskTemplate.fromDTO(templateDTO);
                }
                return templateDTO;
              }) || [],

            taskInstances:
              parsed.taskInstances?.map((instanceDTO: any) => {
                if (instanceDTO && typeof TaskInstance?.fromDTO === 'function') {
                  return TaskInstance.fromDTO(instanceDTO);
                }
                return instanceDTO;
              }) || [],

            metaTemplates:
              parsed.metaTemplates?.map((metaTemplateDTO: any) => {
                if (metaTemplateDTO && typeof TaskMetaTemplate?.fromDTO === 'function') {
                  return TaskMetaTemplate.fromDTO(metaTemplateDTO);
                }
                return metaTemplateDTO;
              }) || [],
          };
        } catch (error) {
          console.error('TaskStore 反序列化失败:', error);
          return {};
        }
      },
    },
  },
});
