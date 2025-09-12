import { ref } from 'vue';
import { useGoalServices } from './useGoalService';
import { GoalRecord } from '../../domain/entities/record';

export function useGoalRecordDialog() {
    const { handleAddGoalRecordToGoal } = useGoalServices();

    const recordDialog = ref<{
        show: boolean,
        record: GoalRecord | null,
        goalUuid: string,
        keyResultUuid: string,
    }>({
        show: false,
        record: null,
        goalUuid: '',
        keyResultUuid: '',
    });

    const startAddGoalRecord = (goalUuid: string, keyResultUuid: string) => {
        recordDialog.value = {
            show: true,
            record: null,
            goalUuid: goalUuid,
            keyResultUuid: keyResultUuid,
        };
    };


    
    return {
        recordDialog,
        startAddGoalRecord,
        handleAddGoalRecordToGoal
    };
}
