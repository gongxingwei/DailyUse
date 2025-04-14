import { ref, computed } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import { useGoalDirStore } from '../stores/goalDirStore';
import type { IGoal } from '../types/goal';

export function useGoalManagement() {
    const goalStore = useGoalStore();
    const goalDirStore = useGoalDirStore();
    // 目标文件夹相关
    const selectedDirId = ref<string>('all');
    const goalsInCurDir = computed(() => {
        let goals = goalStore.getGoalsByDirId(selectedDirId.value);
        return goals;
    })
    const selectDir = (dirId: string) => {
        selectedDirId.value = dirId;
    };

    const showGoalDialog = ref(false);
    const showGoalDirDialog = ref(false);
    const editGoal = ref('temp');
    const editMode = ref<'create' | 'edit'>('create');

    const goalDirs = computed(() => goalDirStore.getAllDirs);
    const addGoal = () => {
        editMode.value = 'create';
        editGoal.value = 'temp';
        showGoalDialog.value = true;
    };

    const saveGoal = () => {
        const savedGoal = goalStore.addGoal();
        if (savedGoal) {
            showGoalDialog.value = false;
        }
    };

    const updateGoal = (goal: IGoal) => {
        goalStore.updateGoal(goal);
        showGoalDialog.value = false;
    };

    return {
        // 目标文件夹相关
        selectedDirId,
        goalsInCurDir,
        selectDir,

        // 目标相关
        showGoalDialog,
        showGoalDirDialog,
        editGoal,
        editMode,

        // Computed
        goalDirs,


        // Methods

        addGoal,
        saveGoal,
        updateGoal,
    };
}
