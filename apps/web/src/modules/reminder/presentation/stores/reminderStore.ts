import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ReminderContracts } from '@dailyuse/contracts';
import { ReminderTemplate, ReminderTemplateGroup, ReminderInstance } from '@dailyuse/domain-client';

/**
 * Reminder Store - 状态管理
 * 职责：纯数据存储和缓存管理，不执行业务逻辑
 */
export const useReminderStore = defineStore('reminder', () => {
  // ===== 状态 =====

  // 提醒模板 (存储域实体对象)
  const reminderTemplates = ref<ReminderTemplate[]>([]);

  // 提醒分组 (存储域实体对象)
  const reminderGroups = ref<ReminderTemplateGroup[]>([]);

  // 提醒实例 (存储域实体对象)
  const reminderInstances = ref<ReminderInstance[]>([]);

  // 当前选中的模板 (域实体对象)
  const selectedTemplate = ref<ReminderTemplate | null>(null);

  // 当前选中的分组 (域实体对象)
  const selectedGroup = ref<ReminderTemplateGroup | null>(null);

  // UI状态
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 过滤器状态
  const filters = ref({
    groupUuid: '',
    priority: '',
    enabled: null as boolean | null,
    status: '',
  });

  // 启用状态控制状态
  const enableStatusOperation = ref({
    isProcessing: false,
    operationType: null as string | null,
    targetUuid: null as string | null,
  });

  // 即将到来的提醒缓存
  const upcomingReminders = ref<any>(null);
  const upcomingRemindersLastUpdate = ref<Date | null>(null);

  // ===== 计算属性 =====

  /**
   * 获取所有提醒模板
   */
  const getAllReminderTemplates = computed(() => reminderTemplates.value);

  /**
   * 获取启用的提醒模板
   */
  const getEnabledReminderTemplates = computed(() =>
    reminderTemplates.value.filter((template) => template.enabled),
  );

  /**
   * 获取所有提醒分组
   */
  const getAllReminderGroups = computed(() => reminderGroups.value);

  /**
   * 获取所有提醒模板分组 (别名)
   */
  const reminderTemplateGroups = computed(() => reminderGroups.value);

  /**
   * 获取所有提醒实例 (从模板中提取)
   */
  const getAllReminderInstances = computed(() =>
    reminderTemplates.value.flatMap((template) => template.instances || []),
  );

  /**
   * 获取活跃的提醒实例 (从模板中提取)
   */
  const getActiveReminderInstances = computed(() =>
    reminderTemplates.value
      .flatMap((template) => template.instances || [])
      .filter(
        (instance) =>
          instance.status === ReminderContracts.ReminderStatus.TRIGGERED ||
          instance.status === ReminderContracts.ReminderStatus.PENDING,
      ),
  );

  /**
   * 根据模板分组的实例 (域实体对象) - 直接从模板中访问
   */
  const getInstancesByTemplate = computed(() => {
    const grouped: Record<string, ReminderInstance[]> = {};
    reminderTemplates.value.forEach((template) => {
      if (template.instances && template.instances.length > 0) {
        grouped[template.uuid] = template.instances;
      }
    });
    return grouped;
  });

  /**
   * 过滤后的模板列表
   */
  const getFilteredTemplates = computed(() => {
    let filtered = reminderTemplates.value;

    if (filters.value.groupUuid) {
      filtered = filtered.filter((template) => template.groupUuid === filters.value.groupUuid);
    }

    if (filters.value.priority) {
      filtered = filtered.filter((template) => template.priority === filters.value.priority);
    }

    if (filters.value.enabled !== null) {
      filtered = filtered.filter((template) => template.enabled === filters.value.enabled);
    }

    return filtered;
  });

  // ===== 状态操作方法 =====

  /**
   * 设置加载状态
   */
  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  /**
   * 设置错误信息
   */
  const setError = (errorMessage: string | null) => {
    error.value = errorMessage;
  };

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null;
  };

  // ===== 提醒模板管理 =====

  /**
   * 设置提醒模板列表 (域实体对象)
   */
  const setReminderTemplates = (templates: ReminderTemplate[]) => {
    reminderTemplates.value = templates;
  };

  /**
   * 添加或更新提醒模板 (域实体对象)
   */
  const addOrUpdateReminderTemplate = (template: ReminderTemplate) => {
    const index = reminderTemplates.value.findIndex((t) => t.uuid === template.uuid);
    if (index >= 0) {
      reminderTemplates.value[index] = template;
    } else {
      reminderTemplates.value.push(template);
    }
  };

  /**
   * 删除提醒模板
   */
  const removeReminderTemplate = (uuid: string) => {
    const index = reminderTemplates.value.findIndex((t) => t.uuid === uuid);
    if (index >= 0) {
      reminderTemplates.value.splice(index, 1);
    }
  };

  /**
   * 根据UUID获取提醒模板 (返回域实体对象)
   */
  const getReminderTemplateByUuid = (uuid: string): ReminderTemplate | null => {
    return reminderTemplates.value.find((t) => t.uuid === uuid) || null;
  };

  /**
   * 设置选中的模板 (域实体对象)
   */
  const setSelectedTemplate = (template: ReminderTemplate | null) => {
    selectedTemplate.value = template;
  };

  // ===== 提醒分组管理 =====

  /**
   * 设置提醒分组列表 (域实体对象)
   */
  const setReminderGroups = (groups: ReminderTemplateGroup[]) => {
    reminderGroups.value = groups;
  };

  /**
   * 设置提醒模板分组列表 (别名方法，兼容ReminderWebApplicationService) (域实体对象)
   */
  const setReminderTemplateGroups = (groups: ReminderTemplateGroup[]) => {
    reminderGroups.value = groups;
  };

  /**
   * 添加或更新提醒分组 (域实体对象)
   */
  const addOrUpdateReminderGroup = (group: ReminderTemplateGroup) => {
    const index = reminderGroups.value.findIndex((g) => g.uuid === group.uuid);
    if (index >= 0) {
      reminderGroups.value[index] = group;
    } else {
      reminderGroups.value.push(group);
    }
  };

  /**
   * 添加或更新提醒模板分组 (别名方法，兼容ReminderWebApplicationService) (域实体对象)
   */
  const addOrUpdateReminderTemplateGroup = (group: ReminderTemplateGroup) => {
    const index = reminderGroups.value.findIndex((g) => g.uuid === group.uuid);
    if (index >= 0) {
      reminderGroups.value[index] = group;
    } else {
      reminderGroups.value.push(group);
    }
  };

  /**
   * 删除提醒分组
   */
  const removeReminderGroup = (uuid: string) => {
    const index = reminderGroups.value.findIndex((g) => g.uuid === uuid);
    if (index >= 0) {
      reminderGroups.value.splice(index, 1);
    }
  };

  /**
   * 删除提醒模板分组 (别名方法，兼容ReminderWebApplicationService)
   */
  const removeReminderTemplateGroup = (uuid: string) => {
    const index = reminderGroups.value.findIndex((g) => g.uuid === uuid);
    if (index >= 0) {
      reminderGroups.value.splice(index, 1);
    }
  };

  /**
   * 根据UUID获取提醒分组 (返回域实体对象)
   */
  const getReminderGroupByUuid = (uuid: string): ReminderTemplateGroup | null => {
    return (reminderGroups.value.find((g) => g.uuid === uuid) as ReminderTemplateGroup) || null;
  };

  /**
   * 根据UUID获取提醒模板分组 (别名方法，兼容ReminderWebApplicationService) (返回域实体对象)
   */
  const getReminderTemplateGroupByUuid = (uuid: string): ReminderTemplateGroup | null => {
    return (reminderGroups.value.find((g) => g.uuid === uuid) as ReminderTemplateGroup) || null;
  };

  /**
   * 设置选中的分组 (域实体对象)
   */
  const setSelectedGroup = (group: ReminderTemplateGroup | null) => {
    selectedGroup.value = group;
  };

  // ===== 提醒实例管理 =====
  // 注意：Instances 现在通过 Template 聚合根管理，不再维护独立的 instances 数组
  // 所有实例操作应该通过更新对应的 Template 来完成

  /**
   * @deprecated 实例现在在 Template 内部，通过 getAllReminderInstances 计算属性访问
   * 设置提醒实例列表 (域实体对象)
   */
  const setReminderInstances = (instances: ReminderInstance[]) => {
    reminderInstances.value = instances;
  };

  /**
   * 添加或更新提醒实例 (域实体对象)
   * 注意：这会同时更新对应的 Template 对象
   */
  const addOrUpdateReminderInstance = (instance: ReminderInstance) => {
    // 找到对应的 template
    const template = reminderTemplates.value.find((t) => t.uuid === instance.templateUuid);
    if (template && template.instances) {
      const instanceIndex = template.instances.findIndex((i) => i.uuid === instance.uuid);
      if (instanceIndex >= 0) {
        template.instances[instanceIndex] = instance;
      } else {
        template.instances.push(instance);
      }
    }

    // 兼容旧代码：同时更新独立的 instances 数组
    const index = reminderInstances.value.findIndex((i) => i.uuid === instance.uuid);
    if (index >= 0) {
      reminderInstances.value[index] = instance;
    } else {
      reminderInstances.value.push(instance);
    }
  };

  /**
   * 批量添加或更新提醒实例 (域实体对象)
   */
  const addOrUpdateReminderInstances = (instances: ReminderInstance[]) => {
    instances.forEach((instance) => {
      addOrUpdateReminderInstance(instance);
    });
  };

  /**
   * 删除提醒实例
   */
  const removeReminderInstance = (uuid: string) => {
    // 从所有 templates 中删除
    reminderTemplates.value.forEach((template) => {
      if (template.instances) {
        const index = template.instances.findIndex((i) => i.uuid === uuid);
        if (index >= 0) {
          template.instances.splice(index, 1);
        }
      }
    });

    // 兼容旧代码：同时删除独立数组中的实例
    const index = reminderInstances.value.findIndex((i) => i.uuid === uuid);
    if (index >= 0) {
      reminderInstances.value.splice(index, 1);
    }
  };

  /**
   * 根据UUID获取提醒实例 (返回域实体对象)
   * 从所有模板中查找
   */
  const getReminderInstanceByUuid = (uuid: string): ReminderInstance | null => {
    for (const template of reminderTemplates.value) {
      if (template.instances) {
        const instance = template.instances.find((i) => i.uuid === uuid);
        if (instance) {
          return instance;
        }
      }
    }
    return null;
  };

  /**
   * 根据模板UUID获取提醒实例列表 (返回域实体对象数组)
   * 直接从模板中访问
   */
  const getReminderInstancesByTemplate = (templateUuid: string): ReminderInstance[] => {
    const template = reminderTemplates.value.find((t) => t.uuid === templateUuid);
    return template?.instances || [];
  };

  // ===== 过滤器管理 =====

  /**
   * 设置过滤器
   */
  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  /**
   * 清除过滤器
   */
  const clearFilters = () => {
    filters.value = {
      groupUuid: '',
      priority: '',
      enabled: null,
      status: '',
    };
  };

  // ===== 启用状态控制管理 =====

  /**
   * 设置启用状态操作
   */
  const setEnableStatusOperation = (
    isProcessing: boolean,
    operationType?: string,
    targetUuid?: string,
  ) => {
    enableStatusOperation.value = {
      isProcessing,
      operationType: operationType || null,
      targetUuid: targetUuid || null,
    };
  };

  /**
   * 清除启用状态操作
   */
  const clearEnableStatusOperation = () => {
    enableStatusOperation.value = {
      isProcessing: false,
      operationType: null,
      targetUuid: null,
    };
  };

  /**
   * 设置即将到来的提醒缓存
   */
  const setUpcomingReminders = (data: any) => {
    upcomingReminders.value = data;
    upcomingRemindersLastUpdate.value = new Date();
  };

  /**
   * 清除即将到来的提醒缓存
   */
  const clearUpcomingReminders = () => {
    upcomingReminders.value = null;
    upcomingRemindersLastUpdate.value = null;
  };

  /**
   * 检查即将到来的提醒缓存是否有效
   */
  const isUpcomingRemindersCacheValid = (maxAgeMs: number = 60000): boolean => {
    if (!upcomingRemindersLastUpdate.value) return false;
    return Date.now() - upcomingRemindersLastUpdate.value.getTime() < maxAgeMs;
  };

  // ===== 缓存管理 =====

  /**
   * 清除所有缓存数据
   */
  const clearAll = () => {
    reminderTemplates.value = [];
    reminderGroups.value = [];
    reminderInstances.value = [];
    selectedTemplate.value = null;
    selectedGroup.value = null;
    error.value = null;
    clearFilters();
    clearEnableStatusOperation();
    clearUpcomingReminders();
  };

  /**
   * 刷新指定模板的实例数据
   */
  const refreshTemplateInstances = (templateUuid: string) => {
    // 移除该模板的所有实例，等待重新加载
    reminderInstances.value = reminderInstances.value.filter(
      (instance) => instance.templateUuid !== templateUuid,
    );
  };

  /**
   * 初始化标识（用于判断是否已初始化）
   */
  const isInitialized = ref(false);

  /**
   * 初始化 store
   */
  const initialize = () => {
    isInitialized.value = true;
  };

  /**
   * 检查是否应该刷新缓存
   */
  const shouldRefreshCache = (): boolean => {
    // 简单的缓存策略，可以根据需要扩展
    return false;
  };

  /**
   * 获取所有模板（getter 的别名）
   */
  const getAllTemplates = computed(() => reminderTemplates.value);

  /**
   * 更新模板（addOrUpdateReminderTemplate 的别名）
   */
  const updateReminderTemplate = (template: ReminderTemplate) => {
    addOrUpdateReminderTemplate(template);
  };

  /**
   * 设置模板启用状态
   */
  const setTemplateEnabled = (templateUuid: string, enabled: boolean) => {
    const template = getReminderTemplateByUuid(templateUuid);
    if (template) {
      // 这里需要根据实际的 domain model 来更新状态
      // 假设 ReminderTemplate 有一个 setEnabled 方法
      (template as any).enabled = enabled;
      addOrUpdateReminderTemplate(template);
    }
  };

  /**
   * 设置分组启用状态
   */
  const setGroupEnabled = (groupUuid: string, enabled: boolean) => {
    const group = getReminderGroupByUuid(groupUuid);
    if (group) {
      // 这里需要根据实际的 domain model 来更新状态
      (group as any).enabled = enabled;
      addOrUpdateReminderGroup(group);
    }
  };

  /**
   * 设置分组启用模式
   */
  const setGroupEnableMode = (groupUuid: string, mode: 'group' | 'individual') => {
    const group = getReminderGroupByUuid(groupUuid);
    if (group) {
      // 这里需要根据实际的 domain model 来更新状态
      (group as any).enableMode = mode;
      addOrUpdateReminderGroup(group);
    }
  };

  return {
    // 状态
    reminderTemplates: getAllReminderTemplates,
    reminderGroups: getAllReminderGroups,
    reminderTemplateGroups, // 添加这个别名
    reminderInstances: getAllReminderInstances,
    selectedTemplate,
    selectedGroup,
    isLoading,
    error,
    filters,
    enableStatusOperation,
    upcomingReminders,
    upcomingRemindersLastUpdate,

    // 计算属性
    getEnabledReminderTemplates,
    getActiveReminderInstances,
    getInstancesByTemplate,
    getFilteredTemplates,

    // 状态操作
    setLoading,
    setError,
    clearError,

    // 提醒模板操作
    setReminderTemplates,
    addOrUpdateReminderTemplate,
    removeReminderTemplate,
    getReminderTemplateByUuid,
    setSelectedTemplate,

    // 提醒分组操作
    setReminderGroups,
    setReminderTemplateGroups,
    addOrUpdateReminderGroup,
    addOrUpdateReminderTemplateGroup,
    removeReminderGroup,
    removeReminderTemplateGroup,
    getReminderGroupByUuid,
    getReminderTemplateGroupByUuid,
    setSelectedGroup,

    // 提醒实例操作
    setReminderInstances,
    addOrUpdateReminderInstance,
    addOrUpdateReminderInstances,
    removeReminderInstance,
    getReminderInstanceByUuid,
    getReminderInstancesByTemplate,

    // 过滤器操作
    setFilters,
    clearFilters,

    // 启用状态控制操作
    setEnableStatusOperation,
    clearEnableStatusOperation,

    // 即将到来的提醒操作
    setUpcomingReminders,
    clearUpcomingReminders,
    isUpcomingRemindersCacheValid,

    // 缓存管理
    clearAll,
    refreshTemplateInstances,

    // 初始化相关
    isInitialized,
    initialize,
    shouldRefreshCache,

    // 额外的 getter 和操作方法
    getAllTemplates,
    updateReminderTemplate,
    setTemplateEnabled,
    setGroupEnabled,
    setGroupEnableMode,
  };
});

export type ReminderStore = ReturnType<typeof useReminderStore>;

/**
 * 获取 Reminder Store 实例的工厂函数
 * 供 ApplicationService 直接使用，不依赖 composable 上下文
 */
let _reminderStoreInstance: ReminderStore | null = null;

export function getReminderStore(): ReminderStore {
  if (!_reminderStoreInstance) {
    _reminderStoreInstance = useReminderStore();
  }
  return _reminderStoreInstance;
}
