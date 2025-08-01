import { useGoalServices } from "./useGoalService";
import { ref } from "vue";
import { Goal } from "../../domain/aggregates/goal";
import { KeyResult } from "../../domain/entities/keyResult";
import { GoalReview } from "../../domain/entities/goalReview";
import router from "@/shared/router";
export function useGoalDialog() {
  const { handleCreateGoal, handleUpdateGoal, handleDeleteGoal } =
    useGoalServices();
  const goalDialog = ref<{
    show: boolean;
    goal: Goal | null;
  }>({
    show: false,
    goal: null,
  });

  const startCreateGoal = () => {
    goalDialog.value = {
      show: true,
      goal: null,
    };
  };

  const startEditGoal = (goal: Goal) => {
    goalDialog.value = {
      show: true,
      goal: goal,
    };
  };

  // ========== keyResult ==========

  const keyResultDialog = ref<{
    show: boolean;
    keyResult: KeyResult | null;
  }>({
    show: false,
    keyResult: null,
  });

  // 开始创建关键结果
  const startCreateKeyResult = () => {
    keyResultDialog.value.keyResult = null;
    keyResultDialog.value.show = true;
  };

  const handleCreateKeyResult = async (goal: Goal, keyResult: KeyResult) => {
    console.log("Creating key result:", goal, keyResult);
    goal.addKeyResult(keyResult);
    // goal.keyResults = [...goal.keyResults]; 不需要这行代码也能实现响应式，确定后后可以去除
  };

  // 开始编辑关键结果
  const startEditKeyResult = (keyResult: KeyResult) => {
    keyResultDialog.value = {
      show: true,
      keyResult: keyResult,
    };
  };

  const handleUpdateKeyResult = async (goal: Goal, keyResult: KeyResult) => {
    goal.updateKeyResult(keyResult);
    goal.keyResults = [...goal.keyResults];
  };

  const handleRemoveKeyResult = async (goal: Goal, keyResultUuid: string) => {
    goal.removeKeyResult(keyResultUuid);
    goal.keyResults = [...goal.keyResults];
  };

  // ======= goalReview =======
  const goalReviewDialog = ref<{
    show: boolean;
    goal: Goal | null;
  }>({
    show: false,
    goal: null,
  });

  const showReviewCard = (goal: Goal) => {
    goalReviewDialog.value = {
      show: true,
      goal,
    };
  };

  const startCreateGoalReview = (goalUuid: string) => {
    router.push({
      name: "goal-review",
      params: {
        goalUuid: goalUuid,
      },
    });
  };

  return {
    goalDialog,
    startCreateGoal,
    startEditGoal,
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,

    keyResultDialog,
    startCreateKeyResult,
    startEditKeyResult,
    handleCreateKeyResult,
    handleUpdateKeyResult,
    handleRemoveKeyResult,

    goalReviewDialog,
    showReviewCard,
    startCreateGoalReview,
  };
}
