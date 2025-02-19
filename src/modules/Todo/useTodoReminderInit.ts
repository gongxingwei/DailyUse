import { useTodoStore } from '@/modules/Todo/todoStore';
import { scheduleService } from '@/shared/utils/schedule/main';
import { notification } from '@/shared/utils/notification/notification';
import { onMounted, onUnmounted } from 'vue';
import type { UrgencyLevel } from '@/shared/types/time';

export function useReminderInit() {
    const todoStore = useTodoStore();
    let cleanup: (() => void) | null = null;

    const handleReminderNotification = async (reminder: { 
        title: string; 
        body: string; 
        urgency: UrgencyLevel 
    }, _id: string) => {
        switch (reminder.urgency) {
            case 'critical':
                await notification.showWarning(
                    reminder.title,
                    reminder.body
                );
                break;
            case 'normal':
            case 'low':
                await notification.showSimple(
                    reminder.title,
                    reminder.body
                );
                break;
        }
    };

    const initializeReminders = async () => {
        await todoStore.initializeTodoSchedules();

        cleanup = scheduleService.onScheduleTriggered(({ id, task }) => {
            if (task.type === 'REMINDER') {
                handleReminderNotification(task.payload, id);
            }
        });

    };

    onMounted(() => {
        initializeReminders();
    });

    onUnmounted(() => {
        if (cleanup) {
            cleanup();
        }
    });

    return {
        initializeReminders
    };
}