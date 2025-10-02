/**
 * Goal 乐观更新 Composable
 * 使用 Vue 3 Composition API 实现乐观更新模式
 *
 * 文件位置建议: apps/web/src/modules/goal/presentation/composables/useGoalOptimistic.ts
 */

import { ref, computed, watch } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { Goal, KeyResult, GoalRecord, GoalReview } from '@dailyuse/domain-client/goal';

/**
 * 乐观更新标记接口
 */
interface OptimisticMeta {
  _optimistic?: boolean; // 标记为乐观数据
  _error?: string; // 错误信息
  _retryCount?: number; // 重试次数
  _timestamp?: number; // 创建时间戳
}

/**
 * 带乐观更新元数据的 ClientDTO
 */
type OptimisticGoalDTO = GoalContracts.GoalClientDTO & OptimisticMeta;
type OptimisticKeyResultDTO = GoalContracts.KeyResultClientDTO & OptimisticMeta;
type OptimisticGoalRecordDTO = GoalContracts.GoalRecordClientDTO & OptimisticMeta;

/**
 * API 响应类型
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * 模拟 API 调用（实际使用时替换为真实 API）
 */
const mockGoalApi = {
  async createGoal(request: GoalContracts.CreateGoalRequest): Promise<GoalContracts.GoalClientDTO> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 模拟网络延迟
    // 模拟成功响应
    const goal = Goal.forCreate({
      name: request.name,
      description: request.description,
      color: request.color || '#3B82F6',
      startTime: request.startTime,
      endTime: request.endTime,
      note: request.note,
      dirUuid: request.dirUuid,
      analysis: request.analysis,
      metadata: request.metadata,
    });
    // 使用前端传入的 UUID
    (goal as any)._uuid = request.uuid;
    return goal.toClientDTO();
  },

  async createKeyResult(
    goalUuid: string,
    request: GoalContracts.CreateKeyResultRequest,
  ): Promise<GoalContracts.KeyResultClientDTO> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const kr = KeyResult.forCreate({
      goalUuid,
      name: request.name,
      startValue: request.startValue,
      targetValue: request.targetValue,
      unit: request.unit,
      weight: request.weight,
      calculationMethod: request.calculationMethod,
    });
    (kr as any)._uuid = request.uuid;
    return kr.toClientDTO();
  },

  async createRecord(
    goalUuid: string,
    request: GoalContracts.CreateGoalRecordRequest,
  ): Promise<GoalContracts.GoalRecordClientDTO> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const record = GoalRecord.forCreate({
      goalUuid,
      keyResultUuid: request.keyResultUuid,
      value: request.value,
      note: request.note,
    });
    (record as any)._uuid = request.uuid;
    return record.toClientDTO();
  },
};

/**
 * 乐观更新 Composable
 */
export function useGoalOptimistic() {
  // ===== 状态管理 =====

  const goals = ref<Map<string, OptimisticGoalDTO>>(new Map());
  const isLoading = ref(false);
  const lastError = ref<Error | null>(null);

  // ===== 计算属性 =====

  /**
   * 所有目标（包括乐观数据）
   */
  const allGoals = computed(() => {
    return Array.from(goals.value.values());
  });

  /**
   * 已确认的目标（不包括乐观数据）
   */
  const confirmedGoals = computed(() => {
    return allGoals.value.filter((g) => !g._optimistic);
  });

  /**
   * 待确认的目标（仅乐观数据）
   */
  const pendingGoals = computed(() => {
    return allGoals.value.filter((g) => g._optimistic && !g._error);
  });

  /**
   * 失败的目标（乐观数据但有错误）
   */
  const failedGoals = computed(() => {
    return allGoals.value.filter((g) => g._optimistic && g._error);
  });

  /**
   * 待确认数量
   */
  const pendingCount = computed(() => pendingGoals.value.length);

  // ===== 乐观更新方法 =====

  /**
   * 乐观创建目标
   *
   * @example
   * ```typescript
   * const { createGoalOptimistic } = useGoalOptimistic();
   *
   * const result = await createGoalOptimistic({
   *   name: '学习 TypeScript',
   *   startTime: Date.now(),
   *   endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
   *   analysis: {
   *     motive: '提升技术能力',
   *     feasibility: '可行',
   *     importanceLevel: ImportanceLevel.High,
   *     urgencyLevel: UrgencyLevel.High,
   *   },
   * });
   * ```
   */
  async function createGoalOptimistic(data: {
    name: string;
    description?: string;
    color?: string;
    startTime: number;
    endTime: number;
    note?: string;
    dirUuid?: string;
    analysis: GoalContracts.GoalDTO['analysis'];
    metadata?: GoalContracts.GoalDTO['metadata'];
  }): Promise<ApiResponse<GoalContracts.GoalClientDTO>> {
    // 1. 使用 forCreate 创建前端实体（自动生成UUID）
    const goal = Goal.forCreate(data);
    const goalUuid = goal.uuid;

    // 2. 立即添加到本地状态（乐观更新）
    const tempGoal: OptimisticGoalDTO = {
      ...goal.toClientDTO(),
      _optimistic: true, // ✅ 标记为乐观数据
      _timestamp: Date.now(),
    };
    goals.value.set(goalUuid, tempGoal);

    try {
      // 3. 发送创建请求（包含前端UUID）
      const request = goal.toCreateRequest();
      const response = await mockGoalApi.createGoal(request);

      // 4. 成功：用服务器数据替换临时数据
      goals.value.set(goalUuid, {
        ...response,
        _optimistic: false, // ✅ 移除乐观标记
      });

      return { success: true, data: response };
    } catch (error) {
      // 5. 失败：标记错误但保留数据（让用户看到失败）
      const failedGoal = goals.value.get(goalUuid);
      if (failedGoal) {
        goals.value.set(goalUuid, {
          ...failedGoal,
          _optimistic: true,
          _error: (error as Error).message, // ✅ 显示错误信息
          _retryCount: (failedGoal._retryCount || 0) + 1,
        });
      }

      lastError.value = error as Error;

      // 可选：自动移除失败的目标
      setTimeout(() => {
        goals.value.delete(goalUuid);
      }, 5000); // 5秒后移除

      return { success: false, error: error as Error };
    }
  }

  /**
   * 乐观添加关键结果
   *
   * @example
   * ```typescript
   * await addKeyResultOptimistic(goalUuid, {
   *   name: '完成10个项目',
   *   startValue: 0,
   *   targetValue: 10,
   *   unit: '个',
   *   weight: 30,
   * });
   * ```
   */
  async function addKeyResultOptimistic(
    goalUuid: string,
    data: {
      name: string;
      startValue: number;
      targetValue: number;
      unit: string;
      weight: number;
      calculationMethod?: GoalContracts.KeyResultCalculationMethod;
    },
  ): Promise<ApiResponse<GoalContracts.KeyResultClientDTO>> {
    // 1. 检查目标是否存在
    const goal = goals.value.get(goalUuid);
    if (!goal) {
      return { success: false, error: new Error('目标不存在') };
    }

    // 2. 创建关键结果实体
    const kr = KeyResult.forCreate({
      goalUuid,
      ...data,
    });
    const krUuid = kr.uuid;

    // 3. 立即添加到本地目标
    const tempKR: OptimisticKeyResultDTO = {
      ...kr.toClientDTO(),
      _optimistic: true,
      _timestamp: Date.now(),
    };

    goal.keyResults = [...(goal.keyResults || []), tempKR];
    goals.value.set(goalUuid, { ...goal });

    try {
      // 4. 发送请求
      const request = kr.toCreateRequest();
      const response = await mockGoalApi.createKeyResult(goalUuid, request);

      // 5. 成功：更新数据
      goal.keyResults = goal.keyResults?.map((k) =>
        k.uuid === krUuid ? { ...response, _optimistic: false } : k,
      );
      goals.value.set(goalUuid, { ...goal });

      return { success: true, data: response };
    } catch (error) {
      // 6. 失败：移除临时数据
      goal.keyResults = goal.keyResults?.filter((k) => k.uuid !== krUuid);
      goals.value.set(goalUuid, { ...goal });

      lastError.value = error as Error;
      return { success: false, error: error as Error };
    }
  }

  /**
   * 乐观添加进度记录
   *
   * @example
   * ```typescript
   * await addRecordOptimistic(goalUuid, keyResultUuid, 2, '完成了2个项目');
   * ```
   */
  async function addRecordOptimistic(
    goalUuid: string,
    keyResultUuid: string,
    value: number,
    note?: string,
  ): Promise<ApiResponse<GoalContracts.GoalRecordClientDTO>> {
    // 1. 检查目标是否存在
    const goal = goals.value.get(goalUuid);
    if (!goal) {
      return { success: false, error: new Error('目标不存在') };
    }

    // 2. 检查关键结果是否存在
    const kr = goal.keyResults?.find((k) => k.uuid === keyResultUuid);
    if (!kr) {
      return { success: false, error: new Error('关键结果不存在') };
    }

    // 3. 创建记录实体
    const record = GoalRecord.forCreate({
      goalUuid,
      keyResultUuid,
      value,
      note,
    });
    const recordUuid = record.uuid;

    // 4. 立即更新本地数据
    // 4.1 更新关键结果的当前值
    const newCurrentValue = kr.currentValue + value;
    kr.currentValue = newCurrentValue;
    kr.progress = Math.min(
      100,
      ((newCurrentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100,
    );
    kr.isCompleted = newCurrentValue >= kr.targetValue;
    kr.remaining = Math.max(0, kr.targetValue - newCurrentValue);

    // 4.2 添加记录
    const tempRecord: OptimisticGoalRecordDTO = {
      ...record.toClientDTO(),
      _optimistic: true,
      _timestamp: Date.now(),
    };

    goal.records = [...(goal.records || []), tempRecord];
    goals.value.set(goalUuid, { ...goal });

    try {
      // 5. 发送请求
      const request = record.toCreateRequest();
      const response = await mockGoalApi.createRecord(goalUuid, request);

      // 6. 成功：确认数据
      goal.records = goal.records?.map((r) =>
        r.uuid === recordUuid ? { ...response, _optimistic: false } : r,
      );
      goals.value.set(goalUuid, { ...goal });

      return { success: true, data: response };
    } catch (error) {
      // 7. 失败：回滚
      // 回滚关键结果的当前值
      kr.currentValue -= value;
      kr.progress = Math.min(
        100,
        ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100,
      );
      kr.isCompleted = kr.currentValue >= kr.targetValue;
      kr.remaining = Math.max(0, kr.targetValue - kr.currentValue);

      // 移除临时记录
      goal.records = goal.records?.filter((r) => r.uuid !== recordUuid);
      goals.value.set(goalUuid, { ...goal });

      lastError.value = error as Error;
      return { success: false, error: error as Error };
    }
  }

  /**
   * 重试失败的操作
   */
  async function retryFailed(goalUuid: string): Promise<void> {
    const goal = goals.value.get(goalUuid);
    if (!goal || !goal._error) return;

    // 移除错误标记，重新尝试
    delete goal._error;
    goal._optimistic = true;
    goals.value.set(goalUuid, { ...goal });

    // 重新发送请求（这里需要根据实际情况实现）
    // ...
  }

  /**
   * 取消乐观更新（移除未确认的数据）
   */
  function cancelOptimistic(goalUuid: string): void {
    const goal = goals.value.get(goalUuid);
    if (goal && goal._optimistic) {
      goals.value.delete(goalUuid);
    }
  }

  /**
   * 清空所有失败的乐观数据
   */
  function clearFailed(): void {
    for (const [uuid, goal] of goals.value.entries()) {
      if (goal._optimistic && goal._error) {
        goals.value.delete(uuid);
      }
    }
  }

  /**
   * 获取目标（含实时计算）
   */
  function getGoal(goalUuid: string): OptimisticGoalDTO | undefined {
    return goals.value.get(goalUuid);
  }

  /**
   * 批量加载目标
   */
  function loadGoals(goalsData: GoalContracts.GoalClientDTO[]): void {
    for (const goalData of goalsData) {
      goals.value.set(goalData.uuid, {
        ...goalData,
        _optimistic: false,
      });
    }
  }

  // ===== 监听器 =====

  /**
   * 监听待确认数量变化
   */
  watch(pendingCount, (count) => {
    console.log(`[Optimistic] 待确认数量: ${count}`);
  });

  // ===== 返回 API =====

  return {
    // 状态
    goals: allGoals,
    confirmedGoals,
    pendingGoals,
    failedGoals,
    pendingCount,
    isLoading,
    lastError,

    // 方法
    createGoalOptimistic,
    addKeyResultOptimistic,
    addRecordOptimistic,
    retryFailed,
    cancelOptimistic,
    clearFailed,
    getGoal,
    loadGoals,
  };
}

/**
 * 使用示例
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useGoalOptimistic } from './composables/useGoalOptimistic';
 *
 * const {
 *   goals,
 *   pendingGoals,
 *   failedGoals,
 *   createGoalOptimistic,
 *   addKeyResultOptimistic,
 *   addRecordOptimistic,
 * } = useGoalOptimistic();
 *
 * // 创建目标
 * async function handleCreateGoal() {
 *   const result = await createGoalOptimistic({
 *     name: '学习 Vue 3',
 *     startTime: Date.now(),
 *     endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
 *     analysis: {
 *       motive: '提升前端技能',
 *       feasibility: '可行',
 *       importanceLevel: ImportanceLevel.High,
 *       urgencyLevel: UrgencyLevel.High,
 *     },
 *   });
 *
 *   if (result.success) {
 *     console.log('目标创建成功（或乐观显示）');
 *   }
 * }
 *
 * // 添加关键结果
 * async function handleAddKeyResult(goalUuid: string) {
 *   await addKeyResultOptimistic(goalUuid, {
 *     name: '完成文档阅读',
 *     startValue: 0,
 *     targetValue: 100,
 *     unit: '页',
 *     weight: 40,
 *   });
 * }
 *
 * // 添加进度记录
 * async function handleAddRecord(goalUuid: string, krUuid: string) {
 *   await addRecordOptimistic(goalUuid, krUuid, 10, '今天读了10页');
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <!-- 待确认提示 -->
 *     <div v-if="pendingGoals.length > 0" class="pending-notice">
 *       🔄 正在同步 {{ pendingGoals.length }} 个目标...
 *     </div>
 *
 *     <!-- 失败提示 -->
 *     <div v-if="failedGoals.length > 0" class="failed-notice">
 *       ❌ {{ failedGoals.length }} 个目标同步失败
 *     </div>
 *
 *     <!-- 目标列表 -->
 *     <div v-for="goal in goals" :key="goal.uuid">
 *       <div :class="{ optimistic: goal._optimistic, error: goal._error }">
 *         <h3>{{ goal.name }}</h3>
 *         <span v-if="goal._optimistic">🔄 同步中...</span>
 *         <span v-if="goal._error">❌ {{ goal._error }}</span>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 *
 * <style scoped>
 * .optimistic {
 *   opacity: 0.7;
 *   border: 1px dashed #ccc;
 * }
 *
 * .error {
 *   background-color: #fee;
 *   border-color: #f00;
 * }
 *
 * .pending-notice {
 *   background-color: #e3f2fd;
 *   padding: 8px;
 *   border-radius: 4px;
 *   margin-bottom: 16px;
 * }
 *
 * .failed-notice {
 *   background-color: #ffebee;
 *   padding: 8px;
 *   border-radius: 4px;
 *   margin-bottom: 16px;
 * }
 * </style>
 * ```
 */
