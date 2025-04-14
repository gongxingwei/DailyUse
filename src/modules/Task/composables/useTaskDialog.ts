import { ref } from 'vue';
import type { ITaskInstance } from '../types/task';
import { useTaskStore } from '../stores/taskStore';

export function useTaskDialog() {
    const taskStore = useTaskStore();
    
    // 编辑任务模板相关
    const showEditTaskTemplateDialog = ref(false);
    const selectedTask = ref<ITaskInstance | null>(null);

    const startCreateTaskTemplate = () => {
        taskStore.initTempTaskTemplate('temp');
        showEditTaskTemplateDialog.value = true;
    };
    const startEditTaskTemplate = (taskTemplateId: string) => {
        taskStore.initTempTaskTemplate(taskTemplateId);
        showEditTaskTemplateDialog.value = true;
    };
    const cancelEditTaskTemplate = () => {
        taskStore.resetTempTaskTemplate();
        closeEditDialog();
    }
    const handleSaveTaskTemplate = async () => {
        taskStore.saveTempTaskTemplate();
        closeEditDialog();
    };
    const closeEditDialog = () => {
        showEditTaskTemplateDialog.value = false;
    };

    // 任务信息卡片
    const showTaskInfoCard = ref(false);
    const taskInfoCard = (task: ITaskInstance) => {
        selectedTask.value = task;
        showTaskInfoCard.value = true;
    };

    const closeTaskInfoCard = () => {
        showTaskInfoCard.value = false;
        selectedTask.value = null;
    };

    const handleTaskComplete = async () => {
        if (selectedTask.value) {
            await taskStore.completeTask(selectedTask.value.id);
            closeTaskInfoCard();
        }
    };

    return {
        // 编辑任务模板相关
        showEditTaskTemplateDialog,
        startEditTaskTemplate,
        startCreateTaskTemplate,
        handleSaveTaskTemplate,
        cancelEditTaskTemplate,
        // 任务信息卡片方法
        showTaskInfoCard,
        taskInfoCard,
        closeTaskInfoCard,
        handleTaskComplete,
    };
}