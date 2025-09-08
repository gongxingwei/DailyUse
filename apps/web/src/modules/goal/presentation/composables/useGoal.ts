import { ref, computed, reactive, watch } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, GoalDir } from '@dailyuse/domain-client';
import { GoalWebApplicationService } from '../../application/services/GoalWebApplicationService';
import { useGoalStore } from '../stores/goalStore';

/**
 * Goal 业务逻辑 Composable
 * 提供响应式的目标管理功能
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
  const selectedGoals = computed(() => {
    // 由于 store 中没有 selectedGoals，我们暂时返回空数组
    return [] as Goal[];
  });

  // ===== 本地状态 =====
  const editingGoal = ref<Goal | null>(null);
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const searchQuery = ref('');
  const filters = reactive({
    status: '',
    dirUuid: '',
    startDate: '',
    endDate: '',
  });

  // ===== Goal CRUD 操作 =====

  /**
   * 创建新目标
   */
  const createGoal = async (data: GoalContracts.CreateGoalRequest) => {
    try {
      const response = await goalService.createGoal(data);
      showCreateDialog.value = false;
      return response;
    } catch (error) {
      console.error('创建目标失败:', error);
      throw error;
    }
  };

  /**
   * 获取目标列表
   */
  const fetchGoals = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      return await goalService.getGoals(params);
    } catch (error) {
      console.error('获取目标列表失败:', error);
      throw error;
    }
  };

  /**
   * 获取目标详情
   */
  const fetchGoalById = async (uuid: string) => {
    try {
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
   * 更新目标
   */
  const updateGoal = async (uuid: string, data: GoalContracts.UpdateGoalRequest) => {
    try {
      const response = await goalService.updateGoal(uuid, data);
      showEditDialog.value = false;
      editingGoal.value = null;
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
      return await goalService.createGoalDir(data);
    } catch (error) {
      console.error('创建目标目录失败:', error);
      throw error;
    }
  };

  /**
   * 获取目标目录列表
   */
  const fetchGoalDirs = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string;
  }) => {
    try {
      return await goalService.getGoalDirs(params);
    } catch (error) {
      console.error('获取目标目录列表失败:', error);
      throw error;
    }
  };

  /**
   * 更新目标目录
   */
  const updateGoalDir = async (uuid: string, data: GoalContracts.UpdateGoalDirRequest) => {
    try {
      return await goalService.updateGoalDir(uuid, data);
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

    await fetchGoals(params);
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
    await fetchGoals();
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
  const openEditDialog = (goal: Goal) => {
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
  const selectGoal = (goal: Goal) => {
    goalStore.setSelectedGoal(goal.uuid);
  };

  /**
   * 切换目标选中状态
   */
  const toggleGoalSelection = (goal: Goal) => {
    // 由于当前 store 只支持单选，这里简化为选择/取消选择
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

  // ===== 批量操作 =====

  /**
   * 批量删除选中的目标
   */
  const deleteSelectedGoals = async () => {
    try {
      // 由于当前只支持单选，只删除当前选中的目标
      if (currentGoal.value) {
        await deleteGoal(currentGoal.value.uuid);
        clearSelection();
      }
    } catch (error) {
      console.error('删除选中目标失败:', error);
      throw error;
    }
  };

  /**
   * 批量更新选中目标的状态
   */
  const updateSelectedGoalsStatus = async (status: string) => {
    try {
      // 由于当前只支持单选，只更新当前选中的目标
      if (!currentGoal.value) {
        return;
      }

      const goal = currentGoal.value;
      switch (status) {
        case 'active':
          await activateGoal(goal.uuid);
          break;
        case 'paused':
          await pauseGoal(goal.uuid);
          break;
        case 'completed':
          await completeGoal(goal.uuid);
          break;
        case 'archived':
          await archiveGoal(goal.uuid);
          break;
        default:
          throw new Error(`不支持的状态: ${status}`);
      }

      clearSelection();
    } catch (error) {
      console.error('批量更新目标状态失败:', error);
      throw error;
    }
  }; // ===== 工具方法 =====

  /**
   * 刷新数据
   */
  const refresh = async () => {
    await goalService.refreshAll();
  };

  /**
   * 初始化
   */
  const initialize = async () => {
    await goalService.initialize();
  };

  // ===== 计算属性 =====

  /**
   * 过滤后的目标列表
   */
  const filteredGoals = computed(() => {
    let result = goals.value;

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(
        (goal: Goal) =>
          goal.name.toLowerCase().includes(query) ||
          (goal.description && goal.description.toLowerCase().includes(query)),
      );
    }

    // 状态过滤
    if (filters.status) {
      result = result.filter((goal: Goal) => goal.lifecycle.status === filters.status);
    }

    // 目录过滤
    if (filters.dirUuid) {
      result = result.filter((goal: Goal) => goal.dirUuid === filters.dirUuid);
    }

    return result;
  });

  /**
   * 目标统计信息
   */
  const goalStats = computed(() => {
    const allGoals = goals.value;
    return {
      total: allGoals.length,
      active: allGoals.filter((g: Goal) => g.lifecycle.status === 'active').length,
      paused: allGoals.filter((g: Goal) => g.lifecycle.status === 'paused').length,
      completed: allGoals.filter((g: Goal) => g.lifecycle.status === 'completed').length,
      archived: allGoals.filter((g: Goal) => g.lifecycle.status === 'archived').length,
    };
  });

  /**
   * 是否有选中的目标
   */
  const hasSelection = computed(() => selectedGoals.value.length > 0);

  // ===== 监听器 =====

  // 监听搜索查询变化，自动过滤
  watch(searchQuery, (newQuery) => {
    // 可以添加防抖逻辑
    // debounce(() => applyFilters(), 300);
  });

  return {
    // 响应式状态
    isLoading,
    error,
    goals,
    goalDirs,
    currentGoal,
    selectedGoals,
    filteredGoals,
    goalStats,
    hasSelection,

    // 本地状态
    editingGoal,
    showCreateDialog,
    showEditDialog,
    searchQuery,
    filters,

    // Goal 操作
    createGoal,
    fetchGoals,
    fetchGoalById,
    updateGoal,
    deleteGoal,

    // Goal 状态管理
    activateGoal,
    pauseGoal,
    completeGoal,
    archiveGoal,

    // GoalDir 操作
    createGoalDir,
    fetchGoalDirs,
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

    // 批量操作
    deleteSelectedGoals,
    updateSelectedGoalsStatus,

    // 工具方法
    refresh,
    initialize,
  };
}
