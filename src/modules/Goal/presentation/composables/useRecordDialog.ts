import { ref } from 'vue';
import { useGoalStore } from '../stores/goalStore.new';
import type { IRecordCreate } from '../types/goal';

export function useRecordDialog() {
    const goalStore = useGoalStore();
    const showRecordDialog = ref(false);
    const selectedKeyResultId = ref('');

    const startAddRecord = (keyResultId: string) => {
        selectedKeyResultId.value = keyResultId;
        showRecordDialog.value = true;
    };

    const handleSaveRecord = async (record: IRecordCreate, goalId: string, keyResultId: string) => {
        try {
            // Convert the date string to a proper DateTime format
            const recordData = {
                keyResultId,
                value: record.value,
                note: record.note
            };
            
            await goalStore.addRecord(goalId, recordData);
            closeRecordDialog();
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
