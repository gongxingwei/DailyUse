import { ref } from 'vue'
import { useGoalStore } from '../stores/goalStore'

export function useGoalDialog() {
  const showGoalDialog = ref(false)
  const editGoalId = ref('temp')
  const editMode = ref<'create' | 'edit'>('create')
  const goalStore = useGoalStore()

  // 编辑目标
  const editGoal = (goalId: string) => {
    // 生成一个临时目标
    try {
      goalStore.initTempGoalByGoalId(goalId)
    } catch (error) {
      console.error('目标不存在，无法编辑')
      return
    }
    editGoalId.value = goalId
    editMode.value = 'edit'
    showGoalDialog.value = true

  }
  // 开始创建新的目标
  const startCreateGoal = () => {
    editMode.value = 'create'
    editGoalId.value = 'temp'
    showGoalDialog.value = true
  }
  // 开始编辑目标
  const startEditGoal = (goalId: string) => {
    editMode.value = 'edit'
    editGoalId.value = goalId
    showGoalDialog.value = true
  }

  const closeDialog = () => {
    showGoalDialog.value = false
  }
  // 保存目标(创建或编辑)
  const saveGoal = () => {
    const savedGoal = goalStore.saveTempGoalChanges()
    if (savedGoal) {
      // 清除临时目标
      goalStore.clearTempGoal()
      closeDialog()
    }
  }
  // 关键结果相关
  const showKeyResultDialog = ref(false)
  const editKeyResultId = ref('temp')
  const editKeyResultMode = ref<'create' | 'edit'>('create')

  // 开始创建新的关键结果
  const startCreateKeyResult = () => {
    editKeyResultMode.value = 'create'
    editKeyResultId.value = 'temp'
    showKeyResultDialog.value = true
  }
  // 开始编辑关键结果
  const startEditKeyResult = (keyResultId: string) => {
    if (!keyResultId) {
      console.error('No key result ID provided');
      return;
    }
    editKeyResultMode.value = 'edit';
    editKeyResultId.value = keyResultId;
    showKeyResultDialog.value = true;
  };
  // 取消关键结果编辑
  const cancelKeyResultEdit = () => {
    showKeyResultDialog.value = false

  }
  // 保存关键结果(创建或编辑)
  const saveKeyResult = () => {
    goalStore.saveTempKeyResultChanges()
  }
  // 删除关键结果
  const deleteKeyResult = (keyResultId: string) => {
    goalStore.deleteTempKeyResult(keyResultId)
  }


  return {
    showGoalDialog,
    editGoalId,
    editMode,
    editGoal,
    startCreateGoal,
    startEditGoal,
    closeDialog,
    saveGoal,
    showKeyResultDialog,
    editKeyResultId,
    editKeyResultMode,
    startCreateKeyResult,
    startEditKeyResult,
    cancelKeyResultEdit,
    saveKeyResult,
    deleteKeyResult,

  }
}