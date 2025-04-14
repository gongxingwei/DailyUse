import { ref } from 'vue'
import { useGoalStore } from '../stores/goalStore'

export function useGoalDialog() {
  const showGoalDialog = ref(false)

  const goalStore = useGoalStore()
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
  const startEditKeyResult = (goalId:string, keyResultId: string) => {
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


  return {
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

  }
}