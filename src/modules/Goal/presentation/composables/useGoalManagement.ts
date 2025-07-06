import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGoalStore } from '../stores/goalStore.new';

export function useGoalManagement() {
    const goalStore = useGoalStore();
    const router = useRouter();
    // 选择的目标文件夹下的目标
    const selectedDirId = ref<string>('all');
    const goalsInCurDir = computed(() => {
        // localStorage.removeItem('goal');
        let goals = goalStore.getGoalsByDirId(selectedDirId.value);
        return goals;
    })
    const getGoalsCountByDirId = (dirId: string) => {
        const goals = goalStore.getGoalsByDirId(dirId);
        return goals.length;
    };
    // 选择目标文件夹
    const selectDir = (dirId: string) => {
        selectedDirId.value = dirId;
    };
    // 根据标签筛选目标
    const statusTabs = [
        { label: '全部的', value: 'all' },
        { label: '进行中', value: 'in-progress' },
        // { label: '已完成', value: 'completed' },
        { label: '已过期', value: 'expired' }
    ];
    const selectedStatus = ref(statusTabs[0].value);
    // 根据状态筛选目标
    const goalsInCurStatus = computed(() => {
        let goals = goalsInCurDir.value;
        if (selectedStatus.value === 'all') {
            return goals;
        }
        if (selectedStatus.value === 'in-progress') {
            return goals.filter(goal => {
                const now = new Date();
                return new Date(goal.startTime) <= now && new Date(goal.endTime) >= now;
            });
        }
        if (selectedStatus.value === 'expired') {
            return goals.filter(goal => {
                const now = new Date();
                return new Date(goal.endTime) < now;
            });
        }
    });
    // 获取每个类别的目标数量
    const getGoalCountByStatus = (status: string) => {
        const goals = goalsInCurDir.value;
        if (status === 'all') {
            return goals.length;
        }
        if (status === 'in-progress') {
            return goals.filter(goal => {
                const now = new Date();
                return new Date(goal.startTime) <= now && new Date(goal.endTime) >= now;
            }).length;
        }
        if (status === 'expired') {
            return goals.filter(goal => {
                const now = new Date();
                return new Date(goal.endTime) < now;
            }).length;
        }
        return 0;
    };
    // 删除目标
    const showDeleteConfirmDialog = ref(false); // 删除确认对话框
    const startDeleteGoal = () => {
        showDeleteConfirmDialog.value = true;

    }
    const handleDeleteGoal = async (goalId:string) => {
        try {
            await goalStore.deleteGoalById(goalId);
            showDeleteConfirmDialog.value = false;
            // Navigate back after successful deletion
            router.back();
        } catch (error) {
            console.error('Failed to delete goal:', error);
        }
    };
    const cancelDeleteGoal = () => {
        showDeleteConfirmDialog.value = false;
    }

    return {
        // 目标文件夹相关
        selectedDirId,
        goalsInCurDir,
        getGoalsCountByDirId,
        selectDir,
        // 文件夹下的目标状态筛选
        statusTabs,
        selectedStatus,
        goalsInCurStatus,
        getGoalCountByStatus,
        // 删除目标
        showDeleteConfirmDialog,
        startDeleteGoal,
        handleDeleteGoal,
        cancelDeleteGoal,


    };
}
