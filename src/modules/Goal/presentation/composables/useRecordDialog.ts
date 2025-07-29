import { ref } from 'vue';
import { useGoalServices } from './useGoalService';
import { Record } from '../../domain/entities/record';

export function useRecordDialog() {
    const { handleAddRecordToGoal } = useGoalServices();

    const recordDialog = ref<{
        show: boolean,
        record: Record | null,
        goalUuid: string,
        keyResultUuid: string,
    }>({
        show: false,
        record: null,
        goalUuid: '',
        keyResultUuid: '',
    });

    const startAddRecord = (goalUuid: string, keyResultId: string) => {
        recordDialog.value = {
            show: true,
            record: null,
            goalUuid: goalUuid,
            keyResultUuid: keyResultId,
        };
    };


    
    return {
        recordDialog,
        startAddRecord,
        handleAddRecordToGoal
    };
}
