import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoalStore } from '../stores/goalStore';



export interface GoalInsights {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    createdAt: string;
}

export interface PeriodStats {
    completedGoals: number;
    completionRate: number;
    taskCompletionRate: number;
    totalGoals: number;
    totalTasks: number;
    completedTasks: number;
}

export function useGoalReview() {
    const route = useRoute();
    const router = useRouter();
    const goalStore = useGoalStore();
    
    const showGoalReviewRecored = ref(false); // 控制复盘记录的显示与隐藏
    const goalId = route.params.goalId as string;
    const allReviews = goalStore.getReviewsByGoalId(goalId); // 获取所有复盘记录
    // 期中复盘相关
    /* 开始期中复盘 */
    const startMidtermReview = (goalId: string) => {
        router.push({
            name: 'goal-review',
            params: {
                goalId: goalId
            }
        });
    };
    // 保存复盘
    const saveReview = () => {
        goalStore.saveReview();
        router.back();
    };
    // 查看所有的复盘记录卡片
    const viewGoalReviewRecord = () => {
        showGoalReviewRecored.value = true;

    };
    // 关闭复盘记录卡片
    const closeGoalReviewRecord = () => {
        showGoalReviewRecored.value = false;
    }
    

    return {
        allReviews,
        showGoalReviewRecored,
        startMidtermReview,
        saveReview,
        viewGoalReviewRecord,
        closeGoalReviewRecord,

    };
}