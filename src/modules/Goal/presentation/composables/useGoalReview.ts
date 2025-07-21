import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { 
  IGoalReview, 
  IGoalReviewCreateDTO, 
  IGoal 
} from '../../domain/types/goal';
import { getGoalDomainApplicationService } from '../../application/services/goalDomainApplicationService';
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';

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
    const router = useRouter();
    const goalService = getGoalDomainApplicationService();
    
    const showGoalReviewRecored = ref(false);
    const loading = ref(false);
    const reviews = ref<IGoalReview[]>([]);
    const currentGoal = ref<IGoal | null>(null);
    
    // 获取所有复盘记录
    const allReviews = computed(() => {
        return reviews.value;
    });
    
    /**
     * 获取目标的所有复盘记录
     */
    const loadGoalReviews = async (goalUuid: string): Promise<void> => {
        try {
            loading.value = true;
            const reviewList = await goalService.getGoalReviews(goalUuid);
            reviews.value = reviewList;
        } catch (error) {
            console.error('加载复盘记录失败:', error);
            reviews.value = [];
        } finally {
            loading.value = false;
        }
    };
    
    /**
     * 添加复盘记录
     */
    const addReview = async (goalUuid: string, reviewData: IGoalReviewCreateDTO): Promise<boolean> => {
        try {
            loading.value = true;
            const response = await goalService.addReviewToGoal(goalUuid, reviewData);
            
            if (response.success && response.data) {
                // 更新本地复盘列表
                reviews.value.push(response.data.review);
                console.log('复盘添加成功:', response.data.review.uuid);
                return true;
            } else {
                console.error('复盘添加失败:', response.message);
                return false;
            }
        } catch (error) {
            console.error('添加复盘失败:', error);
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    /**
     * 更新复盘记录
     */
    const updateReview = async (
        goalUuid: string, 
        reviewId: string, 
        updateData: Partial<IGoalReviewCreateDTO>
    ): Promise<boolean> => {
        try {
            loading.value = true;
            const response = await goalService.updateReviewInGoal(goalUuid, reviewId, updateData);
            
            if (response.success && response.data) {
                // 更新本地复盘列表
                const index = reviews.value.findIndex(r => r.uuid === reviewId);
                if (index !== -1) {
                    reviews.value[index] = response.data.review;
                }
                console.log('复盘更新成功:', response.data.review.uuid);
                return true;
            } else {
                console.error('复盘更新失败:', response.message);
                return false;
            }
        } catch (error) {
            console.error('更新复盘失败:', error);
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    /**
     * 删除复盘记录
     */
    const removeReview = async (goalUuid: string, reviewId: string): Promise<boolean> => {
        try {
            loading.value = true;
            const response = await goalService.removeReviewFromGoal(goalUuid, reviewId);
            
            if (response.success) {
                // 从本地复盘列表中移除
                reviews.value = reviews.value.filter(r => r.uuid !== reviewId);
                console.log('复盘删除成功');
                return true;
            } else {
                console.error('复盘删除失败:', response.message);
                return false;
            }
        } catch (error) {
            console.error('删除复盘失败:', error);
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    /**
     * 创建目标快照
     */
    const createSnapshot = async (goalUuid: string): Promise<any> => {
        try {
            const response = await goalService.createGoalReviewSnapshot(goalUuid);
            
            if (response.success && response.data) {
                console.log('快照创建成功');
                return response.data.snapshot;
            } else {
                console.error('快照创建失败:', response.message);
                return null;
            }
        } catch (error) {
            console.error('创建快照失败:', error);
            return null;
        }
    };
    
    /**
     * 开始期中复盘
     */
    const startMidtermReview = (goalUuid: string) => {
        router.push({
            name: 'goal-review',
            params: {
                goalUuid: goalUuid
            }
        });
    };
    
    /**
     * 保存复盘
     */
    const saveReview = async (
        goalUuid: string,
        title: string,
        content: IGoalReview['content'],
        rating?: IGoalReview['rating']
    ): Promise<boolean> => {
        const reviewData: IGoalReviewCreateDTO = {
            goalUuid,
            title,
            type: 'midterm', // 默认为期中复盘
            reviewDate: TimeUtils.now(),
            content,
            rating
        };
        
        const success = await addReview(goalUuid, reviewData);
        if (success) {
            router.back();
        }
        return success;
    };
    
    /**
     * 查看所有的复盘记录卡片
     */
    const viewGoalReviewRecord = () => {
        showGoalReviewRecored.value = true;
    };
    
    /**
     * 关闭复盘记录卡片
     */
    const closeGoalReviewRecord = () => {
        showGoalReviewRecored.value = false;
    };

    return {
        // 状态
        loading,
        allReviews,
        reviews,
        showGoalReviewRecored,
        currentGoal,
        
        // 方法
        loadGoalReviews,
        addReview,
        updateReview,
        removeReview,
        createSnapshot,
        startMidtermReview,
        saveReview,
        viewGoalReviewRecord,
        closeGoalReviewRecord,
    };
}