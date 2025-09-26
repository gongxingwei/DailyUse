import { ref, computed } from 'vue';
import { ReminderContracts } from '@dailyuse/contracts';
import { getReminderWebService } from '../../index';
import { useReminderStore } from '../stores/reminderStore';
import type {
  ReminderTemplateGroup,
  ReminderInstance,
  ReminderTemplate,
} from '@dailyuse/domain-client';

/**
 * useReminder Composable
 *
 * 新架构规范：
 * - Composables 只从 store 读取数据，不执行状态修改操作
 * - 所有业务操作通过 ApplicationService 进行
 * - 提供清晰的数据访问接口
 */
export function useReminder() {
  // ===== Store 状态（只读）=====
  const reminderStore = useReminderStore();

  // ===== 本地状态 =====
  const currentTemplate = ref<ReminderTemplate | null>(null);

  // ===== 计算属性（只读数据访问）=====

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
  const enabledGroups = computed(() => reminderGroups.value.filter((group: any) => group.enabled));

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

  // ===== 只读数据访问方法 =====

  /**
   * 根据UUID获取提醒模板
   */
  const getReminderTemplateByUuid = (uuid: string): ReminderTemplate | null => {
    return reminderStore.getReminderTemplateByUuid(uuid);
  };

  /**
   * 根据UUID获取提醒分组
   */
  const getReminderGroupByUuid = (uuid: string): ReminderTemplateGroup | null => {
    return reminderStore.getReminderGroupByUuid(uuid);
  };

  /**
   * 根据UUID获取提醒实例
   */
  const getReminderInstanceByUuid = (uuid: string): ReminderInstance | null => {
    return reminderStore.getReminderInstanceByUuid(uuid);
  };

  /**
   * 获取分组下的所有模板
   */
  const getGroupTemplates = (groupUuid: string): ReminderTemplate[] => {
    return reminderTemplates.value.filter((template) => template.groupUuid === groupUuid);
  };

  /**
   * 获取模板的实例列表
   */
  const getTemplateInstances = (templateUuid: string): ReminderInstance[] => {
    return reminderStore.getReminderInstancesByTemplate(templateUuid);
  };

  /**
   * 获取分组统计信息
   */
  const getGroupStats = (groupUuid: string) => {
    const templates = getGroupTemplates(groupUuid);
    const enabledTemplates = templates.filter((t) => t.enabled);
    const groupInstances = activeInstances.value.filter((instance) =>
      templates.some((t) => t.uuid === instance.templateUuid),
    );

    return {
      totalTemplates: templates.length,
      enabledTemplates: enabledTemplates.length,
      activeInstances: groupInstances.length,
      completionRate: templates.length > 0 ? (enabledTemplates.length / templates.length) * 100 : 0,
    };
  };

  /**
   * 获取模板统计信息
   */
  const getTemplateStats = (templateUuid: string) => {
    const template = getReminderTemplateByUuid(templateUuid);
    const instances = getTemplateInstances(templateUuid);
    const activeTemplateInstances = instances.filter(
      (i) =>
        i.status === ReminderContracts.ReminderStatus.PENDING ||
        i.status === ReminderContracts.ReminderStatus.TRIGGERED,
    );

    return {
      template,
      totalInstances: instances.length,
      activeInstances: activeTemplateInstances.length,
      isEnabled: template?.enabled || false,
    };
  };

  // ===== 本地状态管理 =====

  /**
   * 设置当前模板（仅UI状态）
   */
  const setCurrentTemplate = (template: ReminderTemplate | null): void => {
    currentTemplate.value = template;
  };

  // ===== 返回 API（只读接口）=====

  return {
    // 状态（只读）
    isLoading,
    error,
    currentTemplate,

    // 计算属性（只读）
    reminderTemplates,
    reminderGroups,
    enabledTemplates,
    enabledGroups,
    activeInstances,
    templateInstances,
    stats,

    // 数据访问方法（只读）
    getReminderTemplateByUuid,
    getReminderGroupByUuid,
    getReminderInstanceByUuid,
    getGroupTemplates,
    getTemplateInstances,
    getGroupStats,
    getTemplateStats,

    // 本地状态管理
    setCurrentTemplate,
  };
}

// 默认导出主要的 composable
export default useReminder;
