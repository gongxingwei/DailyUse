import { ref, computed } from "vue";
import { getGoalDomainApplicationService } from "../../application/services/goalDomainApplicationService";
import { useGoalStore } from "../stores/goalStore";
import { Goal } from "../../domain/entities/goal";
/**
 * 目标对话框组合式函数 - 使用临时对象模式
 * 处理目标的创建和编辑操作
 */
export function useGoalDialog() {
  // 使用新的架构组件
  const goalDomainService = getGoalDomainApplicationService();
  const goalStore = useGoalStore();

  // 对话框状态
  const showGoalDialog = ref(false);
  const isEditing = ref(false);
  const editinggoalUuid = ref<string>("");
  const loading = ref(false);
  const goalDialogMode = ref<"create" | "edit">("create");
  const goalData = ref<Goal>(new Goal());


  // 错误状态
  const errors = ref<Record<string, string>>({});

  // 计算属性
  const dialogTitle = computed(() => {
    return isEditing.value ? "编辑目标" : "创建目标";
  });

  const isFormValid = computed(() => {
    return goalData.value.isValid();
  });

  // 双向绑定的计算属性
  const name = computed({
    get: () => goalData.value.name,
    set: (value: string) => {
      goalData.value.updateTitle(value);
      // 清除相关错误
      const newErrors = { ...errors.value };
      delete newErrors.name;
      errors.value = newErrors;
    },
  });

  const description = computed({
    get: () => goalData.value.description,
    set: (value: string | undefined) => {
      goalData.value.updateDescription(value);
    },
  });

  const color = computed({
    get: () => goalData.value.color,
    set: (value: string) => {
      goalData.value.updateColor(value);
    },
  });

  const dirId = computed({
    get: () => goalData.value.dirId,
    set: (value: string) => {
      goalData.value.updateDirId(value);
      // 清除相关错误
      const newErrors = { ...errors.value };
      delete newErrors.dirId;
      errors.value = newErrors;
    },
  });

  const startTime = computed({
    get: () => goalData.value.startTime,
    set: (value: any) => {
      goalData.value.updateStartTime(value);
      // 清除相关错误
      const newErrors = { ...errors.value };
      delete newErrors.startTime;
      delete newErrors.endTime; // 开始时间变化可能影响结束时间验证
      errors.value = newErrors;
    },
  });

  const endTime = computed({
    get: () => goalData.value.endTime,
    set: (value: any) => {
      goalData.value.updateEndTime(value);
      // 清除相关错误
      const newErrors = { ...errors.value };
      delete newErrors.endTime;
      errors.value = newErrors;
    },
  });

  const note = computed({
    get: () => goalData.value.note,
    set: (value: string | undefined) => {
      goalData.value.updateNote(value);
    },
  });

  const keyResults = computed({
    get: () => goalData.value.keyResults,
    set: () => {
      // 关键结果不能直接设置，需要通过特定方法管理
      console.warn('不能直接设置关键结果，请使用 addKeyResult/removeKeyResult/updateKeyResult 方法');
    },
  });

  const analysis = computed({
    get: () => goalData.value.analysis,
    set: (value: any) => {
      if (value.motive !== undefined) {
        goalData.value.updateMotive(value.motive);
      }
      if (value.feasibility !== undefined) {
        goalData.value.updateFeasibility(value.feasibility);
      }
    },
  });

  // 验证表单
  const validateForm = (): boolean => {
    const validationErrors = goalData.value.getValidationErrors();
    errors.value = validationErrors;
    return Object.keys(validationErrors).length === 0;
  };

  // 重置表单
  const resetForm = () => {
    goalData.value = new Goal();
    errors.value = {};
    isEditing.value = false;
    editinggoalUuid.value = "";
  };

  const initGoalData = () => {
    goalData.value = new Goal();
  };

  /**
   * 创建或修改目标业务
   */
  const startCreateGoal = () => {
    goalDialogMode.value = "create";
    initGoalData();
    showGoalDialog.value = true;
  };

  const startEditGoal = (goal: Goal) => {
    goalDialogMode.value = "edit";
    goalData.value = goal.clone(); // 直接使用传入的目标数据
    showGoalDialog.value = true;
  };

  const saveGoal = async () => {
    try {
      // 首先验证表单
      if (!validateForm()) {
        console.error("❌ 表单验证失败");
        return;
      }

      let result;

      if (goalDialogMode.value === "edit") {
        if (!goalData.value) {
          console.error("❌ 编辑目标时未提供目标数据");
          return;
        }
        result = await goalDomainService.updateGoal(goalData.value.toDTO());
      } else {
        if (!goalData.value) {
          console.error("❌ 创建目标时未提供目标数据");
          return;
        }
        result = await goalDomainService.createGoal(goalData.value.toDTO());
      }

      if (result.success) {
        const action = goalDialogMode.value === "edit" ? "更新" : "创建";
        console.log(`✅ 目标${action}成功`);
        // 关闭对话框
        showGoalDialog.value = false;
        // 刷新数据
        await goalDomainService.syncAllData();
      } else {
        console.error("❌ 目标保存失败:", result.message);
        alert("保存失败：" + result.message);
      }
    } catch (error) {
      console.error("❌ 保存目标时发生错误:", error);
      alert("保存目标时发生错误，请稍后重试");
    }
  };

  // 取消操作
  const cancelGoalEdit = () => {
    showGoalDialog.value = false;
    resetForm();
  };

  // 添加关键结果
  const startAddKeyResultForGoal = () => {
    // 为新关键结果提供默认值
    const defaultKeyResult = {
      name: "新关键结果",
      startValue: 0,
      targetValue: 100,
      currentValue: 0,
      calculationMethod: 'sum' as const,
      weight: 1
    };
    goalData.value.addKeyResult(defaultKeyResult);
  };

  // 移除关键结果
  const removeKeyResult = (keyResultId: string) => {
    goalData.value.removeKeyResult(keyResultId);
  };

  // 更新关键结果
  const updateKeyResult = (keyResultId: string, updates: {
    name?: string;
    targetValue?: number;
    weight?: number;
    calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
  }) => {
    goalData.value.updateKeyResult(keyResultId, updates);
  };

  return {
    // 对话框状态
    showGoalDialog,
    isEditing,
    loading,
    dialogTitle,

    // 表单数据 - 使用计算属性进行双向绑定
    name,
    description,
    color,
    dirId,
    startTime,
    endTime,
    note,
    keyResults,
    analysis,

    // 表单状态
    goalData,
    errors,
    isFormValid,

    // 方法
    startCreateGoal,
    startEditGoal,
    saveGoal,
    cancelGoalEdit,
    resetForm,
    validateForm,

    removeKeyResult,
    updateKeyResult,

    // 服务访问
    goalDomainService,
    goalStore,
  };
}
