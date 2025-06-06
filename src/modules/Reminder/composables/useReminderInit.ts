import { watch } from 'vue';
import { useReminderStore } from '@/modules/Reminder/stores/reminderStore';
import { scheduleService } from '@/modules/schedule/services/scheduleService';
import { notificationService } from '@/modules/notification/services/notificationService';
import { onMounted, onUnmounted } from 'vue';
import type { UrgencyLevel } from '@/shared/types/time';

export function useReminderInit(autoInit: boolean = true) {
    const reminderStore = useReminderStore();
    let cleanup: (() => void) | null = null;
    let isInitialized = false;

    const handleReminderNotification = async (reminder: { 
        title: string; 
        body: string; 
        urgency: UrgencyLevel 
    }) => {
        switch (reminder.urgency) {
            case 'critical':
                await notificationService.showWarning(
                    reminder.title,
                    reminder.body
                );
                break;
            case 'normal':
            case 'low':
                await notificationService.showSimple(
                    reminder.title,
                    reminder.body
                );
                break;
        }
    };

    const initializeReminders = async () => {
        try {
            if (reminderStore.reminders.length === 0) {
                console.warn('提醒数据尚未加载，等待数据加载完成...');
                return;
            }
            console.log(`开始初始化 ${reminderStore.reminders.length} 个提醒...`);
            await reminderStore.initializeSchedules();

            cleanup = scheduleService.onScheduleTriggered(({ task }) => {
                if (task.type === 'REMINDER') {
                    handleReminderNotification(task.payload);
                }
            });
            isInitialized = true;
            console.log('提醒初始化完成');
        } catch (error) {
            console.error('提醒初始化失败:', error);
        }

    };

    const stopWatcher = watch(
        () => reminderStore.reminders,
        async (newReminders) => {
            if (newReminders.length > 0 && !isInitialized) {
                await initializeReminders();
            }
        },
        { immediate: true }
    );

    
    if (autoInit) {
        onMounted(() => {
            initializeReminders();
        });
    }

    onUnmounted(() => {
        if (cleanup) {
            cleanup();
        }
        stopWatcher();
    });

    return {
        initializeReminders,
        isInitialized: () => isInitialized // 是否已初始化
    };
}