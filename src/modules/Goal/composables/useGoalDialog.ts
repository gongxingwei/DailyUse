import { ref, reactive, computed, watch } from 'vue'
import { useGoalStore } from '../stores/goalStore'
import { useGoalDirStore } from '../stores/goalDirStore';
import { storeToRefs } from 'pinia';

import type { IGoal } from '../types/goal';

export function useGoalDialog() {
  const goalStore = useGoalStore()
  const goalDirStore = useGoalDirStore()

  const goalDirs = computed(() => {
    return goalDirStore.getUserDirs;
  });
  const { tempGoal } = storeToRefs(goalStore);

  const showGoalDialog = ref(false)

  const activeTab = ref(0);
  const tabs = [
    { name: '基本信息', icon: 'mdi-information' },
    { name: '关键结果', icon: 'mdi-target' },
    { name: '动机与可行性', icon: 'mdi-lightbulb' }
  ];

  // 预定义颜色
  const predefinedColors = [
    '#FF5733', // 红色
    '#FFC300', // 黄色
    '#36D7B7', // 绿色
    '#3498DB', // 蓝色
    '#9B59B6', // 紫色
    '#E74C3C', // 深红色
    '#F1C40F', // 金色
    '#2ECC71', // 翠绿
    '#00CED1', // 青色
    '#8E44AD'  // 深紫色
  ];
  // 开始创建新的目标
  const startCreateGoal = () => {
    const tempGoal = goalStore.initTempGoal()
    if (!tempGoal) {
      console.error('目标创建失败')
      return
    }
    showGoalDialog.value = true
  }
  // 开始编辑目标
  const startEditGoal = (goalId: string) => {
    const tempGoal = goalStore.initTempGoalByGoalId(goalId)
    if (!tempGoal) {
      console.error('目标编辑失败')
      return
    }
    showGoalDialog.value = true
  }
  // 保存目标(创建或编辑)
  const saveGoal = () => {
    const savedGoal = goalStore.saveTempGoal()
    if (savedGoal) {
      closeGoalDialog();
    }
  }
  // 取消目标编辑
  const cancelGoalEdit = () => {
    goalStore.clearTempGoal()
    closeGoalDialog()
  }
  const closeGoalDialog = () => {
    showGoalDialog.value = false
  }

  // 关键结果相关
  const showKeyResultDialog = ref(false)
  // 开始创建新的关键结果
  const startCreateKeyResult = () => {
    const tempKeyResult = goalStore.initTempKeyResult()
    if (!tempKeyResult) {
      console.error('关键结果创建失败')
      return
    }
    showKeyResultDialog.value = true
  }
  // 开始编辑关键结果
  const startEditKeyResult = (goalId: string, keyResultId: string) => {
    if (!keyResultId) {
      console.error('No key result ID provided');
      return;
    }
    const tempKeyResult = goalStore.initTempKeyResultByKeyResultId(goalId, keyResultId);
    if (!tempKeyResult) {
      console.error('关键结果编辑失败')
      return
    }
    showKeyResultDialog.value = true;
  };
  // 取消关键结果编辑
  const cancelKeyResultEdit = () => {
    goalStore.clearTempKeyResult();
    closeKeyResultDialog();
  }
  // 保存关键结果(创建或编辑)
  const saveKeyResult = () => {
    const result = goalStore.saveTempKeyResultChanges()
    if (result) {
      showKeyResultDialog.value = false
    } else {
      console.error('关键结果保存失败')
    }
    closeKeyResultDialog();
  }
  // 删除关键结果
  const deleteKeyResult = (keyResultId: string) => {
    goalStore.deleteTempKeyResult(keyResultId)
  }
  const closeKeyResultDialog = () => {
    showKeyResultDialog.value = false
  }

  // 目标编辑规则
  type ValidationState = {
    [K in keyof Partial<IGoal>]: string | undefined;
  };
  const validationErrors = reactive<ValidationState>({
    title: undefined,
    keyResults: undefined,
    startTime: undefined,
    endTime: undefined,
  });
  // 名称不能为空
  const titleRules = [
    (v: string) => !!v || '名称不能为空',
    (v: string) => (v && v.length <= 50) || '名称不能超过50个字符',
  ]
  // 时间规则
  const minDate = computed(() => {
    return new Date().toISOString().split('T')[0];
  });
  const startTimeRules = [
    (v: string) => !!v || '开始时间不能为空',
    (v: string) => {
      const startDate = new Date(v);
      return startDate >= new Date(minDate.value) || '开始时间不能早于今天';
    }
  ];

  const endTimeRules = [
    (v: string) => !!v || '结束时间不能为空',
    (v: string) => {
      if (!tempGoal.value.startTime) return true;
      const endDate = new Date(v);
      const startDate = new Date(tempGoal.value.startTime);
      return endDate >= startDate || '结束时间不能早于开始时间';
    }
  ];

  const validateDates = () => {
    if (!tempGoal.value.startTime) {
      validationErrors.startTime = '请选择开始时间';
      return false;
    }
    if (!tempGoal.value.endTime) {
      validationErrors.endTime = '请选择结束时间';
      return false;
    }

    const startDate = new Date(tempGoal.value.startTime);
    const endDate = new Date(tempGoal.value.endTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      validationErrors.startTime = '开始时间不能早于今天';
      return false;
    }

    if (endDate < startDate) {
      validationErrors.endTime = '结束时间不能早于开始时间';
      return false;
    }

    validationErrors.startTime = undefined;
    validationErrors.endTime = undefined;
    return true;
  };
  // 至少一个关键结果
  const validateKeyResults = () => {
    if (!tempGoal.value.keyResults || tempGoal.value.keyResults.length === 0) {
      validationErrors.keyResults = '至少需要一个关键结果';
      return false;
    }
    validationErrors.keyResults = undefined;
    return true;
  };

  watch(
    () => tempGoal.value.keyResults,
    () => {
      // console.log('Key Results changed:', tempGoal.value.keyResults);
      validateKeyResults();
    },
    {  deep: true }
  )
  // 验证所有字段，用于保存按钮的启用状态
  const isValid = computed(() => {
    return !Object.values(validationErrors).some(error => error) &&
      tempGoal.value.title.trim() !== '' &&
      validateDates()
  });
  return {
    tempGoal,
    goalDirs,

    activeTab,
    tabs,
    predefinedColors,
    
    showGoalDialog,
    startCreateGoal,
    startEditGoal,
    cancelGoalEdit,
    saveGoal,
    showKeyResultDialog,
    startCreateKeyResult,
    startEditKeyResult,
    cancelKeyResultEdit,
    saveKeyResult,
    deleteKeyResult,

    validationErrors,
    titleRules,
    minDate,
    startTimeRules,
    endTimeRules,
    validateDates,
    validateKeyResults,
    isValid,
  }
}