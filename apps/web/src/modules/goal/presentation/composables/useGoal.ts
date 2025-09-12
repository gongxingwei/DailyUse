import { ref, computed, reactive } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, GoalDir } from '@dailyuse/domain-client';
import { GoalWebApplicationService } from '../../application/services/GoalWebApplicationService';
import { useGoalStore } from '../stores/goalStore';

/**
 * Goal 业务逻辑 Composable - 新架构
 * 基于缓存优先的数据获取策略
 */
export function useGoal() {
  const goalService = new GoalWebApplicationService();
  const goalStore = useGoalStore();

  // ===== 响应式状态 =====
  const isLoading = computed(() => goalStore.isLoading);
  const error = computed(() => goalStore.error);
  const goals = computed(() => goalStore.getAllGoals);
  const goalDirs = computed(() => goalStore.getAllGoalDirs);
  const currentGoal = computed(() => goalStore.getSelectedGoal);

  // ===== 本地状态 =====
  const editingGoal = ref<any | null>(null);
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const searchQuery = ref('');
  const filters = reactive({
    status: '',
    dirUuid: '',
    startDate: '',
    endDate: '',
  });

  // ===== 缓存优先的数据获取方法 =====

  /**
   * 获取目标列表 - 缓存优先策略
   * @param forceRefresh 是否强制从API刷新
   * @param params 查询参数
   */
  const fetchGoals = async (
    forceRefresh = false,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      dirUuid?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => {
    try {
      // 检查是否需要刷新数据
      const needsRefresh =
        forceRefresh ||
        !goalStore.isInitialized ||
        goalStore.goals.length === 0 ||
        goalStore.shouldRefreshCache();

      if (needsRefresh) {
        console.log('从 API 获取目标数据...');
        await goalService.getGoals(params);
      } else {
        console.log('使用缓存的目标数据');
      }

      return goalStore.getAllGoals;
    } catch (error) {
      console.error('获取目标列表失败:', error);
      throw error;
    }
  };

  /**
   * 获取目标目录列表 - 缓存优先策略
   * @param forceRefresh 是否强制从API刷新
   * @param params 查询参数
   */
  const fetchGoalDirs = async (
    forceRefresh = false,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      parentUuid?: string;
    },
  ) => {
    try {
      // 检查是否需要刷新数据
      const needsRefresh =
        forceRefresh ||
        !goalStore.isInitialized ||
        goalStore.goalDirs.length === 0 ||
        goalStore.shouldRefreshCache();

      if (needsRefresh) {
        console.log('从 API 获取目标目录数据...');
        await goalService.getGoalDirs(params);
      } else {
        console.log('使用缓存的目标目录数据');
      }

      return goalStore.getAllGoalDirs;
    } catch (error) {
      console.error('获取目标目录列表失败:', error);
      throw error;
    }
  };

  /**
   * 获取目标详情 - 缓存优先策略
   * @param uuid 目标UUID
   * @param forceRefresh 是否强制从API刷新
   */
  const fetchGoalById = async (uuid: string, forceRefresh = false) => {
    try {
      // 先从缓存中查找
      const cachedGoal = goalStore.getGoalByUuid(uuid);

      if (cachedGoal && !forceRefresh) {
        console.log('使用缓存的目标详情');
        goalStore.setSelectedGoal(uuid);
        return cachedGoal;
      }

      // 从API获取
      console.log('从 API 获取目标详情...');
      const response = await goalService.getGoalById(uuid);

      if (response) {
        goalStore.setSelectedGoal(uuid);
      }

      return response;
    } catch (error) {
      console.error('获取目标详情失败:', error);
      throw error;
    }
  };

  /**
   * 初始化数据 - 加载所有必要的数据
   */
  const initializeData = async () => {
    try {
      // 使用 ApplicationService 的同步方法
      const result = await goalService.syncAllGoals();
      console.log(
        `Goal 数据初始化完成: ${result.goalsCount} 个目标, ${result.goalDirsCount} 个目录`,
      );
    } catch (error) {
      console.error('Goal 数据初始化失败:', error);
      throw error;
    }
  };

  // ===== Goal CRUD 操作 =====

  /**
   * 创建新目标
   */
  const createGoal = async (data: GoalContracts.CreateGoalRequest) => {
    try {
      const response = await goalService.createGoal(data);
      showCreateDialog.value = false;

      // 数据已经在 ApplicationService 中自动同步到 store
      console.log('目标创建成功');
      return response;
    } catch (error) {
      console.error('创建目标失败:', error);
      throw error;
    }
  };

  /**
   * 更新目标
   */
  const updateGoal = async (uuid: string, data: GoalContracts.UpdateGoalRequest) => {
    try {
      const response = await goalService.updateGoal(uuid, data);
      showEditDialog.value = false;
      editingGoal.value = null;

      console.log('目标更新成功');
      return response;
    } catch (error) {
      console.error('更新目标失败:', error);
      throw error;
    }
  };

  /**
   * 删除目标
   */
  const deleteGoal = async (uuid: string) => {
    try {
      await goalService.deleteGoal(uuid);

      // 如果删除的是当前目标，清除选中状态
      if (currentGoal.value?.uuid === uuid) {
        goalStore.setSelectedGoal(null);
      }

      console.log('目标删除成功');
    } catch (error) {
      console.error('删除目标失败:', error);
      throw error;
    }
  };

  // ===== Goal 状态管理 =====

  /**
   * 激活目标
   */
  const activateGoal = async (uuid: string) => {
    try {
      return await goalService.activateGoal(uuid);
    } catch (error) {
      console.error('激活目标失败:', error);
      throw error;
    }
  };

  /**
   * 暂停目标
   */
  const pauseGoal = async (uuid: string) => {
    try {
      return await goalService.pauseGoal(uuid);
    } catch (error) {
      console.error('暂停目标失败:', error);
      throw error;
    }
  };

  /**
   * 完成目标
   */
  const completeGoal = async (uuid: string) => {
    try {
      return await goalService.completeGoal(uuid);
    } catch (error) {
      console.error('完成目标失败:', error);
      throw error;
    }
  };

  /**
   * 归档目标
   */
  const archiveGoal = async (uuid: string) => {
    try {
      return await goalService.archiveGoal(uuid);
    } catch (error) {
      console.error('归档目标失败:', error);
      throw error;
    }
  };

  // ===== GoalDir 操作 =====

  /**
   * 创建目标目录
   */
  const createGoalDir = async (data: GoalContracts.CreateGoalDirRequest) => {
    try {
      const response = await goalService.createGoalDir(data);
      console.log('目标目录创建成功');
      return response;
    } catch (error) {
      console.error('创建目标目录失败:', error);
      throw error;
    }
  };

  /**
   * 更新目标目录
   */
  const updateGoalDir = async (uuid: string, data: GoalContracts.UpdateGoalDirRequest) => {
    try {
      const response = await goalService.updateGoalDir(uuid, data);
      console.log('目标目录更新成功');
      return response;
    } catch (error) {
      console.error('更新目标目录失败:', error);
      throw error;
    }
  };

  /**
   * 删除目标目录
   */
  const deleteGoalDir = async (uuid: string) => {
    try {
      await goalService.deleteGoalDir(uuid);
      console.log('目标目录删除成功');
    } catch (error) {
      console.error('删除目标目录失败:', error);
      throw error;
    }
  };

  // ===== 搜索和筛选 =====

  /**
   * 搜索目标
   */
  const searchGoals = async (
    query: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      dirUuid?: string;
    },
  ) => {
    try {
      return await goalService.searchGoals({
        query,
        ...options,
      });
    } catch (error) {
      console.error('搜索目标失败:', error);
      throw error;
    }
  };

  /**
   * 应用筛选器
   */
  const applyFilters = async () => {
    const params = {
      ...filters,
      // 移除空值
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== '')),
    };

    await fetchGoals(true, params); // 强制刷新以应用新的筛选条件
  };

  /**
   * 清除筛选器
   */
  const clearFilters = async () => {
    Object.assign(filters, {
      status: '',
      dirUuid: '',
      startDate: '',
      endDate: '',
    });
    await fetchGoals(true); // 强制刷新以清除筛选条件
  };

  // ===== UI 交互方法 =====

  /**
   * 打开创建对话框
   */
  const openCreateDialog = () => {
    editingGoal.value = null;
    showCreateDialog.value = true;
  };

  /**
   * 打开编辑对话框
   */
  const openEditDialog = (goal: any) => {
    editingGoal.value = goal;
    showEditDialog.value = true;
  };

  /**
   * 关闭对话框
   */
  const closeDialogs = () => {
    showCreateDialog.value = false;
    showEditDialog.value = false;
    editingGoal.value = null;
  };

  /**
   * 选择目标
   */
  const selectGoal = (goal: any) => {
    goalStore.setSelectedGoal(goal.uuid);
  };

  /**
   * 切换目标选中状态
   */
  const toggleGoalSelection = (goal: any) => {
    if (currentGoal.value?.uuid === goal.uuid) {
      goalStore.setSelectedGoal(null);
    } else {
      goalStore.setSelectedGoal(goal.uuid);
    }
  };

  /**
   * 清除所有选中
   */
  const clearSelection = () => {
    goalStore.setSelectedGoal(null);
  };

  // ===== 工具方法 =====

  /**
   * 手动刷新所有数据
   */
  const refresh = async () => {
    await Promise.all([
      fetchGoals(true), // 强制刷新
      fetchGoalDirs(true), // 强制刷新
    ]);
    console.log('数据刷新完成');
  };

  /**
   * 初始化
   */
  const initialize = async () => {
    try {
      // 使用 ApplicationService 的初始化方法
      await goalService.initialize();
    } catch (error) {
      console.error('初始化失败:', error);
      throw error;
    }
  };

  // ===== 计算属性 =====

  /**
   * 过滤后的目标列表
   */
  const filteredGoals = computed(() => {
    return goalStore.getFilteredGoals;
  });

  /**
   * 目标统计信息
   */
  const goalStats = computed(() => {
    return goalStore.getGoalStatistics;
  });

  /**
   * 目录统计信息
   */
  const goalDirStats = computed(() => {
    return goalStore.getGoalDirStatistics;
  });

  /**
   * 是否有选中的目标
   */
  const hasSelection = computed(() => !!currentGoal.value);

  return {
    // 响应式状态
    isLoading,
    error,
    goals,
    goalDirs,
    currentGoal,
    filteredGoals,
    goalStats,
    goalDirStats,
    hasSelection,

    // 本地状态
    editingGoal,
    showCreateDialog,
    showEditDialog,
    searchQuery,
    filters,

    // 数据获取方法（缓存优先）
    fetchGoals,
    fetchGoalDirs,
    fetchGoalById,
    initializeData,

    // Goal 操作
    createGoal,
    updateGoal,
    deleteGoal,

    // Goal 状态管理
    activateGoal,
    pauseGoal,
    completeGoal,
    archiveGoal,

    // GoalDir 操作
    createGoalDir,
    updateGoalDir,
    deleteGoalDir,

    // 搜索和筛选
    searchGoals,
    applyFilters,
    clearFilters,

    // UI 交互
    openCreateDialog,
    openEditDialog,
    closeDialogs,
    selectGoal,
    toggleGoalSelection,
    clearSelection,

    // 工具方法
    refresh,
    initialize,
  };
}
