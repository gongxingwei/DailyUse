import { ref } from 'vue';
import { getGoalDomainApplicationService } from '../../application/services/goalDomainApplicationService';
import type { IRecordCreate } from '../types/goal';

export function useRecordDialog() {
    const goalService = getGoalDomainApplicationService();
    const showRecordDialog = ref(false);
    const selectedKeyResultId = ref('');

    const startAddRecord = (keyResultId: string) => {
        selectedKeyResultId.value = keyResultId;
        showRecordDialog.value = true;
    };

    const handleSaveRecord = async (record: IRecordCreate, goalUuid: string, keyResultId: string) => {
        try {
            // 使用聚合根驱动的业务方法
            const response = await goalService.addRecordToGoal(
                goalUuid,
                keyResultId,
                record.value,
                record.note
            );
            
            if (response.success) {
                console.log('记录保存成功:', response.data);
                closeRecordDialog();
            } else {
                console.error('记录保存失败:', response.message);
                // 可以在这里添加错误提示
            }
        } catch (error) {
            console.error('Failed to save record:', error);
            // Handle error (could emit an error event or show notification)
        }
    };

    const handleCancelAddRecord = () => {
        closeRecordDialog();
    };

    const closeRecordDialog = () => {
        showRecordDialog.value = false;
        selectedKeyResultId.value = '';
    };
    
    return {
        showRecordDialog,
        selectedKeyResultId,
        startAddRecord,
        closeRecordDialog,
        handleSaveRecord,
        handleCancelAddRecord,
    };
}
