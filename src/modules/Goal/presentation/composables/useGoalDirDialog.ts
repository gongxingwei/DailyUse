import { computed, ref } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import { useAuthenticationStore } from '@/modules/Authentication/presentation/stores/authenticationStore';
import { getGoalDomainApplicationService } from '../../application/services/goalDomainApplicationService';
import { GoalDir } from '../../domain/entities/goalDir';
export function useGoalDirDialog() {
    const showGoalDirDialog = ref(false);
    const goalDirData = ref<GoalDir>(new GoalDir()); // 初始化一个空的 GoalDir 实例
    const goalDirDialogMode = ref<'create' | 'edit'>('create'); // 用于区分创建或编辑模式
    const selectedDirId = ref<string>('all');

    const goalStore = useGoalStore();

    const authStore = useAuthenticationStore();
    
    // 目录相关
    const goalDirs = computed(() => goalStore.getAllGoalDirs);
    const initGoalDirData = () => {
        // 初始化目标目录数据
        goalDirData.value = new GoalDir();
        
    }
    // 开始创建目标节点
    const startCreateGoalDir = () => {
        goalDirDialogMode.value = 'create';
        initGoalDirData();
        showGoalDirDialog.value = true;
        console.log('获取的用户信息:', {
            token: authStore.getToken,
            accountUuid: authStore.getAccountUuid
        });
    };

    // 开始编辑目标节点
    const startEditGoalDir = (dirId: string) => {
        goalDirDialogMode.value = 'edit';
        const dir = goalStore.getGoalDirEntityById(dirId);
        if (!dir) {
            console.error(`没有找到ID为 ${dirId} 的目标目录`);
            return;
        }
        goalDirData.value = dir.clone();
        showGoalDirDialog.value = true;
    };

    // 保存目标节点
    const handleSaveGoalDir = async () => {
        if (goalDirDialogMode.value === 'create' && goalDirData.value) {
            const response = await getGoalDomainApplicationService().createGoalDir(goalDirData.value);
            if (response.success) {
                console.log('✅ 目标目录创建成功:', response.data);
            } else {
                console.error('❌ 创建目标目录失败:', response.message);
            }
        }
        if (goalDirDialogMode.value === 'edit' && goalDirData.value) {
            const response = await getGoalDomainApplicationService().updateGoalDir(goalDirData.value);
            if (response.success) {
                console.log('✅ 目标目录更新成功:', response.data);
            } else {
                console.error('❌ 更新目标目录失败:', response.message);
            }
        }
        // 关闭对话框
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
        goalDirData,
        goalDirDialogMode,
        startCreateGoalDir,
        startEditGoalDir,
        handleSaveGoalDir,
        closeGoalDirDialog,
    };
}