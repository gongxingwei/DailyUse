import { ref, computed, onMounted } from 'vue';
import { ReminderContracts } from '@dailyuse/contracts';
import { ReminderWebApplicationService } from '../../application/services/ReminderWebApplicationService';
import { useReminderStore } from '../stores/reminderStore';
import type {
  ReminderTemplateGroup,
  ReminderInstance,
  ReminderTemplate,
} from '@dailyuse/domain-client';

/**
 * useReminder Composable
 *
 * 提供 Reminder 模块的完整功能封装，遵循 Composable + ApplicationService + Store 架构
 * 集成聚合根控制模式和全局状态管理
 */
export function useReminder() {
  // ===== 应用服务 =====
  const reminderService = new ReminderWebApplicationService();

  // ===== Store 状态 =====
  const reminderStore = useReminderStore();

  // ===== 本地状态 =====
  const isInitialized = ref(false);
  const currentTemplate = ref<ReminderTemplate | null>(null);
  const currentInstances = ref<ReminderInstance[]>([]);

  // ===== 计算属性 =====

  /**
   * 是否正在加载
   */
  const isLoading = computed(() => reminderStore.isLoading);

  /**
   * 错误信息
   */
  const error = computed(() => reminderStore.error);

  /**
   * 所有提醒模板
   */
  const reminderTemplates = computed(() => reminderStore.reminderTemplates);

  /**
   * 启用的提醒模板
   */
  const enabledTemplates = computed(() => reminderStore.getEnabledReminderTemplates);

  /**
   * 活跃的提醒实例
   */
  const activeInstances = computed(() => reminderStore.getActiveReminderInstances);

  /**
   * 当前模板的实例
   */
  const templateInstances = computed(() => {
    if (!currentTemplate.value) return [];
    return reminderStore.getReminderInstancesByTemplate(currentTemplate.value.uuid);
  });

  /**
   * 所有提醒分组
   */
  const reminderGroups = computed(() => reminderStore.reminderGroups);

  /**
   * 启用的提醒分组
   */
  const enabledGroups = computed(() => reminderGroups.value.filter((group) => group.enabled));

  /**
   * 统计信息
   */
  const stats = computed(() => ({
    totalGroups: reminderGroups.value.length,
    enabledGroups: enabledGroups.value.length,
    totalTemplates: reminderTemplates.value.length,
    enabledTemplates: enabledTemplates.value.length,
    activeInstances: activeInstances.value.length,
    pendingReminders: activeInstances.value.filter(
      (i) => (i as ReminderInstance).status === ReminderContracts.ReminderStatus.PENDING,
    ).length,
  }));

  // ===== 提醒分组操作 =====

  /**
   * 创建提醒分组
   */
  const createGroup = async (
    request: ReminderContracts.CreateReminderGroupRequest,
  ): Promise<ReminderTemplateGroup> => {
    return await reminderService.createReminderTemplateGroup(request);
  };

  /**
   * 获取提醒分组列表
   */
  const getGroups = async (params?: {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
  }): Promise<void> => {
    await reminderService.getReminderTemplateGroups(params);
  };

  /**
   * 获取提醒分组详情
   */
  const getGroup = async (uuid: string): Promise<ReminderTemplateGroup | null> => {
    return await reminderService.getReminderTemplateGroup(uuid);
  };

  /**
   * 更新提醒分组
   */
  const updateGroup = async (
    uuid: string,
    request: Partial<ReminderContracts.CreateReminderGroupRequest>,
  ): Promise<ReminderTemplateGroup> => {
    return await reminderService.updateReminderTemplateGroup(uuid, request);
  };

  /**
   * 删除提醒分组
   */
  const deleteGroup = async (uuid: string): Promise<void> => {
    await reminderService.deleteReminderTemplateGroup(uuid);
  };

  /**
   * 切换分组启用状态
   */
  const toggleGroupEnabled = async (uuid: string): Promise<ReminderTemplateGroup | null> => {
    const group = reminderStore.getReminderGroupByUuid(uuid);
    if (group) {
      const updatedGroup = await updateGroup(uuid, { enabled: !group.enabled });
      return updatedGroup;
    }
    return null;
  };

  /**
   * 切换分组启用模式 (group/individual)
   */
  const toggleGroupEnableMode = async (
    uuid: string,
    enableMode: ReminderContracts.ReminderTemplateEnableMode,
  ): Promise<ReminderTemplateGroup | null> => {
    const group = reminderStore.getReminderGroupByUuid(uuid);
    if (group) {
      const updatedGroup = await updateGroup(uuid, { enableMode });
      return updatedGroup;
    }
    return null;
  };

  /**
   * 批量设置分组下模板的启用状态
   */
  const batchSetGroupTemplatesEnabled = async (
    groupUuid: string,
    enabled: boolean,
  ): Promise<void> => {
    const templates = getGroupTemplates(groupUuid);
    const templateUuids = templates.map((t) => t.uuid);
    if (templateUuids.length > 0) {
      await reminderService.batchUpdateTemplatesEnabled(templateUuids, enabled);
    }
  };

  /**
   * 获取分组下的所有模板
   */
  const getGroupTemplates = (groupUuid: string): ReminderTemplate[] => {
    return reminderStore.reminderTemplates.filter((template) => template.groupUuid === groupUuid);
  };

  /**
   * 获取分组统计信息
   */
  const getGroupStats = (groupUuid: string) => {
    const templates = getGroupTemplates(groupUuid);
    const enabledTemplates = templates.filter((t) => t.enabled);
    const activeInstances = reminderStore.getActiveReminderInstances.filter((instance) =>
      templates.some((t) => t.uuid === instance.templateUuid),
    );

    return {
      totalTemplates: templates.length,
      enabledTemplates: enabledTemplates.length,
      activeInstances: activeInstances.length,
      completionRate: templates.length > 0 ? (enabledTemplates.length / templates.length) * 100 : 0,
    };
  };

  // ===== 提醒模板操作 =====

  /**
   * 初始化 Reminder 模块
   */
  const initialize = async (): Promise<void> => {
    if (isInitialized.value) return;

    try {
      await reminderService.getReminderTemplates({ forceRefresh: true });
      await reminderService.getReminderTemplateGroups({ forceRefresh: true });
      isInitialized.value = true;
    } catch (error) {
      console.error('Failed to initialize reminder module:', error);
      throw error;
    }
  };

  /**
   * 创建提醒模板
   */
  const createTemplate = async (
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse> => {
    return await reminderService.createReminderTemplate(request);
  };

  /**
   * 获取提醒模板列表
   */
  const getTemplates = async (params?: {
    page?: number;
    limit?: number;
    groupUuid?: string;
    enabled?: boolean;
    priority?: ReminderContracts.ReminderPriority;
    forceRefresh?: boolean;
  }): Promise<void> => {
    await reminderService.getReminderTemplates(params);
  };

  /**
   * 获取提醒模板详情 (返回域实体对象)
   */
  const getTemplate = async (uuid: string): Promise<ReminderTemplate | null> => {
    const template = await reminderService.getReminderTemplate(uuid);
    if (template) {
      currentTemplate.value = template;
    }
    return template;
  };

  /**
   * 更新提醒模板
   */
  const updateTemplate = async (
    uuid: string,
    request: Partial<ReminderContracts.CreateReminderTemplateRequest>,
  ): Promise<ReminderTemplate> => {
    const template = await reminderService.updateReminderTemplate(uuid, request);
    if (currentTemplate.value?.uuid === uuid) {
      currentTemplate.value = template;
    }
    return template;
  };

  /**
   * 删除提醒模板
   */
  const deleteTemplate = async (uuid: string): Promise<void> => {
    await reminderService.deleteReminderTemplate(uuid);
    if (currentTemplate.value?.uuid === uuid) {
      currentTemplate.value = null;
      currentInstances.value = [];
    }
  };

  /**
   * 切换模板启用状态
   */
  const toggleTemplateEnabled = async (uuid: string): Promise<void> => {
    const template = reminderStore.getReminderTemplateByUuid(uuid);
    if (template) {
      await updateTemplate(uuid, { enabled: !template.enabled });
    }
  };

  // ===== 提醒实例操作 =====

  /**
   * 创建提醒实例
   */
  const createInstance = async (
    templateUuid: string,
    request: ReminderContracts.CreateReminderInstanceRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse> => {
    const instance = await reminderService.createReminderInstance(templateUuid, request);
    if (currentTemplate.value?.uuid === templateUuid) {
      await loadTemplateInstances(templateUuid);
    }
    return instance;
  };

  /**
   * 获取模板的实例列表 (返回域实体对象)
   */
  const getInstances = async (
    templateUuid: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
      forceRefresh?: boolean;
    },
  ): Promise<{
    reminders: ReminderInstance[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> => {
    const result = await reminderService.getReminderInstances(templateUuid, params);
    if (currentTemplate.value?.uuid === templateUuid) {
      currentInstances.value = result.reminders;
    }
    return result;
  };

  /**
   * 加载模板实例
   */
  const loadTemplateInstances = async (templateUuid: string): Promise<void> => {
    await getInstances(templateUuid, { forceRefresh: true });
  };

  /**
   * 响应提醒
   */
  const respondToReminder = async (
    templateUuid: string,
    instanceUuid: string,
    response: ReminderContracts.SnoozeReminderRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse> => {
    const instance = await reminderService.respondToReminder(templateUuid, instanceUuid, response);
    // 刷新当前实例列表
    if (currentTemplate.value?.uuid === templateUuid) {
      await loadTemplateInstances(templateUuid);
    }
    return instance;
  };

  // /**
  //  * 延迟提醒
  //  */
  // const snoozeReminder = async (
  //   templateUuid: string,
  //   instanceUuid: string,
  //   duration: number = 300, // 默认5分钟
  // ): Promise<void> => {
  //   await respondToReminder(templateUuid, instanceUuid, {
  //     action: 'snooze',
  //     snoozeDuration: duration,
  //   });
  // };

  // /**
  //  * 完成提醒
  //  */
  // const completeReminder = async (templateUuid: string, instanceUuid: string): Promise<void> => {
  //   await respondToReminder(templateUuid, instanceUuid, {
  //     action: 'complete',
  //   });
  // };

  // /**
  //  * 忽略提醒
  //  */
  // const dismissReminder = async (templateUuid: string, instanceUuid: string): Promise<void> => {
  //   await respondToReminder(templateUuid, instanceUuid, {
  //     action: 'dismiss',
  //   });
  // };

  /**
   * 批量处理实例
   */
  const batchProcessInstances = async (
    templateUuid: string,
    instanceUuids: string[],
    action: 'snooze' | 'dismiss' | 'complete',
  ): Promise<{ success: boolean; processedCount: number }> => {
    const result = await reminderService.batchProcessInstances(templateUuid, {
      instanceUuids,
      action,
    });
    // 刷新当前实例列表
    if (currentTemplate.value?.uuid === templateUuid) {
      await loadTemplateInstances(templateUuid);
    }
    return result;
  };

  // ===== 全局操作 =====

  /**
   * 获取活跃提醒
   */
  const getActiveReminders = async (params?: {
    limit?: number;
    priority?: ReminderContracts.ReminderPriority;
  }): Promise<ReminderContracts.ReminderListResponse> => {
    return await reminderService.getActiveReminders(params);
  };

  /**
   * 获取全局统计
   */
  const getGlobalStats = async (): Promise<ReminderContracts.ReminderStatsResponse> => {
    return await reminderService.getGlobalStats();
  };

  /**
   * 获取聚合根统计
   */
  const getAggregateStats = async (
    templateUuid: string,
  ): Promise<ReminderContracts.ReminderStatsResponse> => {
    return await reminderService.getAggregateStats(templateUuid);
  };

  /**
   * 检查聚合根健康状态
   */
  const checkAggregateHealth = async (
    templateUuid: string,
  ): Promise<{ isHealthy: boolean; issues: string[] }> => {
    return await reminderService.checkAggregateHealth(templateUuid);
  };

  // ===== 实用功能 =====

  /**
   * 刷新所有数据
   */
  const refreshAll = async (): Promise<void> => {
    await reminderService.refreshAll();
    if (currentTemplate.value) {
      await loadTemplateInstances(currentTemplate.value.uuid);
    }
  };

  /**
   * 清除缓存
   */
  const clearCache = (): void => {
    reminderService.clearCache();
    currentTemplate.value = null;
    currentInstances.value = [];
    isInitialized.value = false;
  };

  /**
   * 设置当前模板
   */
  const setCurrentTemplate = (template: any | null): void => {
    currentTemplate.value = template;
    if (template) {
      loadTemplateInstances(template.uuid);
    } else {
      currentInstances.value = [];
    }
  };

  // ===== 生命周期 =====

  /**
   * 自动初始化
   */
  onMounted(async () => {
    await initialize();
  });

  // ===== 返回 API =====

  return {
    // 状态
    isLoading,
    error,
    isInitialized,
    currentTemplate,
    currentInstances,

    // 计算属性
    reminderTemplates,
    reminderGroups,
    enabledTemplates,
    enabledGroups,
    activeInstances,
    templateInstances,
    stats,

    // 初始化
    initialize,

    // 提醒分组操作
    createGroup,
    getGroups,
    getGroup,
    updateGroup,
    deleteGroup,
    toggleGroupEnabled,
    toggleGroupEnableMode,
    batchSetGroupTemplatesEnabled,
    getGroupTemplates,
    getGroupStats,

    // 提醒模板操作
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateEnabled,

    // 提醒实例操作
    createInstance,
    getInstances,
    loadTemplateInstances,
    respondToReminder,
    // snoozeReminder,
    // completeReminder,
    // dismissReminder,
    batchProcessInstances,

    // 全局操作
    getActiveReminders,
    getGlobalStats,
    getAggregateStats,
    checkAggregateHealth,

    // 实用功能
    refreshAll,
    clearCache,
    setCurrentTemplate,
  };
}

// 默认导出主要的 composable
export default useReminder;
