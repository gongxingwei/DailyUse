import { ref } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import type { IRecordCreate } from '../types/goal';

export function useRecordDialog() {
    const goalStore = useGoalStore();
    const showRecordDialog = ref(false);
    const selectedKeyResultId = ref('');

    const startAddRecord = (keyResultId: string) => {
        selectedKeyResultId.value = keyResultId;
        showRecordDialog.value = true;
    };

    const handleSaveRecord = (record: IRecordCreate, goalId: string, keyResultId: string) => {
        const result = goalStore.addRecord(record, goalId, keyResultId);
        if (result.message) {

        }
        const allGoals = goalStore.getAllGoals;

        closeRecordDialog();
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
