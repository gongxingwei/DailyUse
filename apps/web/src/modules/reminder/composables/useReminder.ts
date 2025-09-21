import { ref, computed } from 'vue';
import type { ReminderTemplate, ReminderTemplateGroup } from '@dailyuse/domain-client';
import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderWebApplicationService } from '../application/services/ReminderWebApplicationService';
import { useReminderStore } from '../presentation/stores/reminderStore';

/**
 * Reminder 模块的 composable
 * 提供完整的聚合根式CRUD操作
 */
export const useReminder = () => {
  // 应用服务实例
  const reminderService = new ReminderWebApplicationService();
  const reminderStore = useReminderStore();

  // 响应式状态
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);

  // 数据存储 - 直接使用store中的数据
  // const templatesList = ref<ReminderTemplate[]>([]);
  // const groupsList = ref<ReminderTemplateGroup[]>([]);
  // const instancesList = ref<any[]>([]);

  // 计算属性 - 从store获取数据
  const templates = computed(() => reminderStore.reminderTemplates);
  const groups = computed(() => reminderStore.reminderTemplateGroups);
  const instances = computed(() => reminderStore.reminderInstances);

  // ===== 初始化与管理 =====

  /**
   * 初始化模块
   */
  const initialize = async () => {
    if (isInitialized.value) return;

    try {
      isLoading.value = true;
      error.value = null;

      // 加载模板和分组数据
      await loadTemplates();
      await loadGroups();

      isInitialized.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 刷新所有数据
   */
  const refresh = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      await reminderService.refreshAll();

      // 重新加载本地数据
      await loadTemplates();
      await loadGroups();
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ===== 数据加载方法 =====

  /**
   * 加载模板数据
   */
  const loadTemplates = async () => {
    // service层会自动更新store，这里只需要调用即可
    await reminderService.getReminderTemplates({ forceRefresh: true });
  };

  /**
   * 加载分组数据
   */
  const loadGroups = async () => {
    // service层会自动更新store，这里只需要调用即可
    await reminderService.getReminderTemplateGroups({ forceRefresh: true });
  };

  // ===== 模板CRUD操作 =====

  /**
   * 创建提醒模板
   */
  const createTemplate = async (
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderTemplate> => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await reminderService.createReminderTemplate(request);
      const template = convertToTemplateEntity(response);

      // 更新本地状态
      templatesList.value.push(template);

      return template;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建模板失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 更新提醒模板
   */
  const updateTemplate = async (
    uuid: string,
    request: Partial<ReminderContracts.CreateReminderTemplateRequest>,
  ): Promise<ReminderTemplate> => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await reminderService.updateReminderTemplate(uuid, request);
      const template = convertToTemplateEntity(response);

      // 更新本地状态
      const index = templatesList.value.findIndex((t) => t.uuid === uuid);
      if (index !== -1) {
        templatesList.value[index] = template;
      }

      return template;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新模板失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取模板详情
   */
  const getTemplate = async (uuid: string): Promise<ReminderTemplate | null> => {
    try {
      // 优先从本地缓存获取
      const cached = templatesList.value.find((t) => t.uuid === uuid);
      if (cached) return cached;

      isLoading.value = true;
      error.value = null;

      const response = await reminderService.getReminderTemplate(uuid);
      if (!response) return null;

      const template = convertToTemplateEntity(response);

      // 更新本地缓存
      const index = templatesList.value.findIndex((t) => t.uuid === uuid);
      if (index !== -1) {
        templatesList.value[index] = template;
      } else {
        templatesList.value.push(template);
      }

      return template;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取模板失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 删除提醒模板
   */
  const deleteTemplate = async (uuid: string): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      await reminderService.deleteReminderTemplate(uuid);

      // 更新本地状态
      templatesList.value = templatesList.value.filter((t) => t.uuid !== uuid);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除模板失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 切换模板启用状态
   */
  const toggleTemplateEnabled = async (uuid: string): Promise<ReminderTemplate> => {
    const template = templatesList.value.find((t) => t.uuid === uuid);
    if (!template) throw new Error('模板不存在');

    // 创建更新请求，包含enabled字段
    const updateRequest = {
      name: template.name,
      message: template.message,
      enabled: !template.enabled,
    } as any; // 临时使用any类型，直到contracts定义更新

    return await updateTemplate(uuid, updateRequest);
  };

  // ===== 分组CRUD操作 =====

  /**
   * 创建提醒分组
   */
  const createGroup = async (request: any): Promise<ReminderTemplateGroup> => {
    try {
      isLoading.value = true;
      error.value = null;

      // service层已经处理了store的更新，这里不需要手动更新
      const group = await reminderService.createReminderTemplateGroup(request);

      return group;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建分组失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 更新提醒分组
   */
  const updateGroup = async (uuid: string, request: any): Promise<ReminderTemplateGroup> => {
    try {
      isLoading.value = true;
      error.value = null;

      // service层已经处理了store的更新，这里不需要手动更新
      const group = await reminderService.updateReminderTemplateGroup(uuid, request);

      return group;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新分组失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 删除提醒分组
   */
  const deleteGroup = async (uuid: string): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      await reminderService.deleteReminderTemplateGroup(uuid);

      // service层已经处理了store的更新，这里不需要手动更新
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除分组失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ===== 实例管理 =====

  /**
   * 创建提醒实例
   */
  const createInstance = async (
    templateUuid: string,
    request: ReminderContracts.CreateReminderInstanceRequest,
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await reminderService.createReminderInstance(templateUuid, request);

      // 更新本地实例列表
      instancesList.value.push(response);

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建实例失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取模板实例列表
   */
  const getInstances = async (templateUuid: string, params?: any) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await reminderService.getReminderInstances(templateUuid, params);

      // 更新本地实例列表
      instancesList.value = response.reminders;

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取实例失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ===== 统计与聚合根操作 =====

  /**
   * 获取全局统计
   */
  const getStats = async () => {
    try {
      return await reminderService.getGlobalStats();
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取统计失败';
      throw err;
    }
  };

  /**
   * 获取聚合根统计
   */
  const getAggregateStats = async (templateUuid: string) => {
    try {
      return await reminderService.getAggregateStats(templateUuid);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取聚合根统计失败';
      throw err;
    }
  };

  // ===== 工具方法 =====

  /**
   * 将contracts响应转换为domain-client实体
   */
  const convertToTemplateEntity = (
    response: ReminderContracts.ReminderTemplateResponse,
  ): ReminderTemplate => {
    // TODO: 使用实际的ReminderTemplate.fromDTO方法
    return {
      uuid: response.uuid,
      name: response.name || '',
      description: response.description || '',
      enabled: response.enabled || false,
      groupUuid: response.groupUuid,
      priority: response.priority,
      message: response.message || '',
      category: response.category || '',
      tags: response.tags || [],
      // 添加其他必需的属性...
    } as ReminderTemplate;
  };

  /**
   * 清除缓存
   */
  const clearCache = () => {
    templatesList.value = [];
    groupsList.value = [];
    instancesList.value = [];
    isInitialized.value = false;
    reminderService.clearCache();
  };

  return {
    // 状态
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isInitialized,

    // 数据
    templates,
    groups,
    instances,

    // 管理方法
    initialize,
    refresh,
    clearCache,

    // 模板CRUD
    createTemplate,
    updateTemplate,
    getTemplate,
    deleteTemplate,
    toggleTemplateEnabled,

    // 分组CRUD
    createGroup,
    updateGroup,
    deleteGroup,

    // 实例管理
    createInstance,
    getInstances,

    // 统计信息
    getStats,
    getAggregateStats,
  };
};
