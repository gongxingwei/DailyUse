import { computed, ref } from 'vue';
import { useGoalStore } from '../stores/goalStore';

export function useGoalDirDialog() {
    const showGoalDirDialog = ref(false);
    const selectedDirId = ref<string>('all');

    const goalStore = useGoalStore();

    // 目录相关
    const goalDirs = computed(() => goalStore.getAllDirs);

    // 开始创建目标节点
    const startCreateGoalDir = () => {
        const tempDir = goalStore.initTempDir();
        if (!tempDir) {
            console.error('目录创建失败');
            return;
        }
        showGoalDirDialog.value = true;
    };
    // 开始编辑目标节点
    const startEditGoalDir = (dirId: string) => {
        const tempDir = goalStore.initTempDirByDirId(dirId);
        if (!tempDir) {
            console.error('目录编辑失败');
            return;
        }
        showGoalDirDialog.value = true;
    };
    // 保存目标节点
    const saveGoalDir = () => {
        goalStore.saveTempDir();
        showGoalDirDialog.value = false;
    }

    // 关闭目录对话框
    const closeGoalDirDialog = () => {
        showGoalDirDialog.value = false;
    };

    return {
        showGoalDirDialog,
        selectedDirId,
        goalDirs,
        startCreateGoalDir,
        startEditGoalDir,
        saveGoalDir,
        closeGoalDirDialog,
    };
}