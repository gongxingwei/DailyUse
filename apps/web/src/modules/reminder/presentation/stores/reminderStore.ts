import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  ReminderTemplate,
  ReminderTemplateGroup,
  ReminderInstance,
} from '@dailyuse/domain-client';

/**
 * Reminder Store - 状态管理
 * 职责：纯数据存储和缓存管理，不执行业务逻辑
 */
export const useReminderStore = defineStore('reminder', () => {
  // ===== 状态 =====

  // 提醒模板
  const reminderTemplates = ref<ReminderTemplate[]>([]);

  // 提醒分组
  const reminderGroups = ref<ReminderTemplateGroup[]>([]);

  // 提醒实例
  const reminderInstances = ref<ReminderInstance[]>([]);

  // 当前选中的模板
  const selectedTemplate = ref<ReminderTemplate | null>(null);

  // 当前选中的分组
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
   * 获取所有提醒实例
   */
  const getAllReminderInstances = computed(() => reminderInstances.value);

  /**
   * 获取活跃的提醒实例
   */
  const getActiveReminderInstances = computed(() =>
    reminderInstances.value.filter(
      (instance) => instance.status === 'scheduled' || instance.status === 'overdue',
    ),
  );

  /**
   * 根据模板分组的实例
   */
  const getInstancesByTemplate = computed(() => {
    const grouped: Record<string, ReminderInstance[]> = {};
    reminderInstances.value.forEach((instance) => {
      if (!grouped[instance.templateUuid]) {
        grouped[instance.templateUuid] = [];
      }
      grouped[instance.templateUuid].push(instance);
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
   * 设置提醒模板列表
   */
  const setReminderTemplates = (templates: ReminderTemplate[]) => {
    reminderTemplates.value = templates;
  };

  /**
   * 添加或更新提醒模板
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
   * 根据UUID获取提醒模板
   */
  const getReminderTemplateByUuid = (uuid: string): ReminderTemplate | null => {
    return reminderTemplates.value.find((t) => t.uuid === uuid) || null;
  };

  /**
   * 设置选中的模板
   */
  const setSelectedTemplate = (template: ReminderTemplate | null) => {
    selectedTemplate.value = template;
  };

  // ===== 提醒分组管理 =====

  /**
   * 设置提醒分组列表
   */
  const setReminderGroups = (groups: ReminderTemplateGroup[]) => {
    reminderGroups.value = groups;
  };

  /**
   * 设置提醒模板分组列表 (别名方法，兼容ReminderWebApplicationService)
   */
  const setReminderTemplateGroups = (groups: ReminderTemplateGroup[]) => {
    reminderGroups.value = groups;
  };

  /**
   * 添加或更新提醒分组
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
   * 添加或更新提醒模板分组 (别名方法，兼容ReminderWebApplicationService)
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
   * 根据UUID获取提醒分组
   */
  const getReminderGroupByUuid = (uuid: string): ReminderTemplateGroup | null => {
    return reminderGroups.value.find((g) => g.uuid === uuid) || null;
  };

  /**
   * 根据UUID获取提醒模板分组 (别名方法，兼容ReminderWebApplicationService)
   */
  const getReminderTemplateGroupByUuid = (uuid: string): ReminderTemplateGroup | null => {
    return reminderGroups.value.find((g) => g.uuid === uuid) || null;
  };

  /**
   * 设置选中的分组
   */
  const setSelectedGroup = (group: ReminderTemplateGroup | null) => {
    selectedGroup.value = group;
  };

  // ===== 提醒实例管理 =====

  /**
   * 设置提醒实例列表
   */
  const setReminderInstances = (instances: ReminderInstance[]) => {
    reminderInstances.value = instances;
  };

  /**
   * 添加或更新提醒实例
   */
  const addOrUpdateReminderInstance = (instance: ReminderInstance) => {
    const index = reminderInstances.value.findIndex((i) => i.uuid === instance.uuid);
    if (index >= 0) {
      reminderInstances.value[index] = instance;
    } else {
      reminderInstances.value.push(instance);
    }
  };

  /**
   * 批量添加或更新提醒实例
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
    const index = reminderInstances.value.findIndex((i) => i.uuid === uuid);
    if (index >= 0) {
      reminderInstances.value.splice(index, 1);
    }
  };

  /**
   * 根据UUID获取提醒实例
   */
  const getReminderInstanceByUuid = (uuid: string): ReminderInstance | null => {
    return reminderInstances.value.find((i) => i.uuid === uuid) || null;
  };

  /**
   * 根据模板UUID获取提醒实例列表
   */
  const getReminderInstancesByTemplate = (templateUuid: string): ReminderInstance[] => {
    return reminderInstances.value.filter((i) => i.templateUuid === templateUuid);
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

    // 缓存管理
    clearAll,
    refreshTemplateInstances,
  };
});

export type ReminderStore = ReturnType<typeof useReminderStore>;
