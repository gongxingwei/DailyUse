import { onMounted, onUnmounted } from 'vue';
import { scheduleService } from '@/shared/utils/schedule/main';
import { notification } from '@/shared/utils/notification/notification';
import { formatDateTime } from '@/shared/utils/dateUtils';
import type { ITaskInstance } from '../types/task';

export function useTaskReminderInit() {
    let cleanupListener: (() => void) | null = null;

    onMounted(() => {
        // 只注册提醒监听器
        cleanupListener = scheduleService.onScheduleTriggered(async ({ task }) => {
            if (task.type === 'taskReminder') {
                const taskInstance = task.payload as ITaskInstance;
                await showTaskReminder(taskInstance);
            }
        });
    });

    onUnmounted(() => {
        if (cleanupListener) {
            cleanupListener();
        }
    });

    async function showTaskReminder(taskInstance: ITaskInstance) {
        if (taskInstance.completed) return;

        await notification.showWarning('任务提醒', `任务 "${taskInstance.title}" 要开始了！\n` +
            `开始时间: ${formatDateTime(taskInstance.startTime ?? new Date())}\n`);
    }
}