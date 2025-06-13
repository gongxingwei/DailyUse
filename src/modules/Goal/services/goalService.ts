import { useGoalStore } from '../stores/goalStore';
/**
 * GoalService 类提供了与目标相关的服务方法。
 * 这些方法主要用于更新关键结果的当前值。
 * @class GoalService
 * @example
 * const goalService = new GoalService();
 * goalService.updateKeyResultCurrentValue('goalId', 'keyResultId', 50);
 * */

class GoalService {

    updateKeyResultCurrentValue(
        goalId: string,
        keyResultId: string,
        currentValue: number
    ): Promise<void> {
        const goalStore = useGoalStore();
        return goalStore.updateKeyResultCurrentValue(goalId, keyResultId, currentValue);
    }
}

export const goalService = new GoalService();