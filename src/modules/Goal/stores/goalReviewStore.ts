import { defineStore } from 'pinia';
import { useGoalStore } from './goalStore';
import { useTaskStore } from '@/modules/Task/stores/taskStore';
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from '@/modules/Account/composables/useUserStore';

// 目标进度接口
interface GoalProgress {
    currentProgress: number;      // 当前进度
    analysis: string;            // 进度分析
}

// 关键结果进度接口
interface KeyResultProgress {
    id: string;                 // 关键结果ID
    name: string;               // 关键结果名称
    targetValue: number;        // 目标值
    currentValue: number;       // 当前值
    analysis: string;           // 进度分析
}

// 任务完成情况接口
interface TaskProgress {
    total: number;              // 总任务数
    completed: number;          // 已完成数
    completionRate: number;     // 完成率
    missedTasks: number;        // 未完成任务数
    analysis: string;           // 任务完成情况分析
}

// 自我诊断接口
interface SelfDiagnosis {
    achievements: string;       // 主要成就
    challenges: string;         // 遇到的挑战
    learnings: string;         // 经验总结
    nextSteps: string;         // 下一步计划
}

// 复盘记录接口
export interface Review {
    id: string;
    goalId: string;
    goalProgress: GoalProgress;          // 目标进度
    keyResultProgress: KeyResultProgress[]; // 关键结果进度
    taskProgress: TaskProgress;          // 任务完成情况
    selfDiagnosis: SelfDiagnosis;       // 自我诊断
    createdAt: string;                   // 创建时间
    updatedAt: string;                   // 更新时间
}

export const useGoalReviewStore = defineStore('goalReview', {
    state: () => ({
        reviews: [
            {
                id: "test-review-001",
                goalId: "test-goal-001",
                goalProgress: {
                    currentProgress: 75,
                    analysis: "目标完成度良好，按计划推进中"
                },
                keyResultProgress: [
                    {
                        id: "kr-001",
                        name: "完成用户注册功能",
                        targetValue: 100,
                        currentValue: 80,
                        analysis: "基本功能已完成，还需优化体验"
                    },
                    {
                        id: "kr-002",
                        name: "提升系统性能",
                        targetValue: 200,
                        currentValue: 150,
                        analysis: "性能提升明显，继续优化中"
                    }
                ],
                taskProgress: {
                    total: 10,
                    completed: 7,
                    completionRate: 70,
                    missedTasks: 3,
                    analysis: "大部分任务按时完成，少数任务需要加快进度"
                },
                selfDiagnosis: {
                    achievements: "1. 完成核心功能开发\n2. 提升了系统整体性能\n3. 优化了用户体验",
                    challenges: "1. 技术难点突破耗时\n2. 团队协作需要改进\n3. 部分任务延期",
                    learnings: "1. 提前规划很重要\n2. 需要加强技术储备\n3. 改进沟通效率",
                    nextSteps: "1. 完成剩余任务\n2. 进行性能优化\n3. 准备用户测试"
                },
                createdAt: "2025-04-11T10:00:00.000Z",
                updatedAt: "2025-04-11T10:00:00.000Z"
            }
        ] as Review[],            // 复盘记录列表
        tempReview: null as Review | null, // 当前复盘记录
    }),

    getters: {
        // 获取所有复盘记录
        getAllReviews: (state) => {
            return state.reviews;
        },
        // 获取指定目标的所有复盘记录
        getReviewsByGoalId: (state) => (goalId: string) => {
            return state.reviews.filter(review => review.goalId === goalId);
        },

        // 获取指定目标的最新复盘记录
        getLatestReview: (state) => (goalId: string) => {
            return state.reviews
                .filter(review => review.goalId === goalId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        },

        // 根据ID获取复盘记录
        getReviewById: (state) => (reviewId: string) => {
            return state.reviews.find(review => review.id === reviewId);
        }
    },

    actions: {
        async initialize() {
            const { loadUserData } = useUserStore<Partial<{ reviews: Review[] }>>('goalReview');
            const data = await loadUserData();
            if (data && data.reviews) {
                this.$patch({ reviews: data.reviews });
            }
        },
        async saveState() {
            const { saveUserData } = useUserStore<Partial<{ reviews: Review[] }>>('goalReview');
            await saveUserData({
                reviews: this.reviews,
            });
        },
        addGoalReview(review: Review) {
            this.reviews.push(review);
        },
        // 创建新的复盘记录
        initTempReview(goalId: string): Review {
            const goalStore = useGoalStore();
            const taskStore = useTaskStore();
            const goal = goalStore.getGoalById(goalId);

            if (!goal) {
                throw new Error('Goal not found');
            }

            // 获取目标进度
            const currentProgress = goalStore.getGoalProgress(goalId);

            // 获取关键结果进度
            const keyResultProgress: KeyResultProgress[] = goal.keyResults.map(kr => ({
                id: kr.id,
                name: kr.name,
                targetValue: kr.targetValue,
                currentValue: kr.startValue,
                analysis: ''
            }));

            // 获取任务完成情况
            const taskStats = taskStore.getTaskStatsForGoal(goalId);

            const newReview: Review = {
                id: 'temp',
                goalId,
                goalProgress: {
                    currentProgress,
                    analysis: ''
                },
                keyResultProgress,
                taskProgress: {
                    total: taskStats.overall.total,
                    completed: taskStats.overall.completed,
                    completionRate: taskStats.overall.completionRate,
                    missedTasks: taskStats.overall.missedTasks,
                    analysis: ''
                },
                selfDiagnosis: {
                    achievements: '',
                    challenges: '',
                    learnings: '',
                    nextSteps: ''
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.tempReview = newReview;
            return newReview;
        },
        // 获取已有的复盘记录
        getExistingReview(reviewId: string): Review | null {
            const review = this.reviews.find(r => r.id === reviewId);
            if (review) {
                this.tempReview = { ...review }; // 创建副本
                return this.tempReview;
            }
            return null;
        },
        // 删除复盘记录
        deleteReview(reviewId: string) {
            const index = this.reviews.findIndex(r => r.id === reviewId);
            if (index !== -1) {
                this.reviews.splice(index, 1);
                if (this.tempReview?.id === reviewId) {
                    this.tempReview = null;
                }
            }
        },
        // 保存复盘记录
        saveReview() {
            if (!this.tempReview || !this.tempReview.goalId) {
                throw new Error('Invalid tempReview: goalId is required');
            }
            const review: Review = {
                ...this.tempReview,
                id: uuidv4(), // 生成唯一ID
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            console.log('Saving review:', review);
            this.reviews.push(review);
            this.tempReview = null; // 清空临时复盘记录
        },
        setCurrentReview(reviewId: string) {
            const review = this.reviews.find(r => r.id === reviewId);
            this.tempReview = review || null;
        },
    },
});