import { onMounted, onUnmounted, watch } from "vue";
import { scheduleService } from "@/shared/services/scheduleService";
import { notificationService } from "@/modules/notification/services/notificationService";
import { useTaskStore } from "@/modules/Task/stores/taskStore";

export function useTaskReminderInit(autoInit: boolean = true) {
  const taskStore = useTaskStore();
  let cleanup: (() => void) | null = null;
  let isInitialized = false;

  const handleTaskReminderNotification = async (task: {
    title: string;
    body: string;
  }) => {
    try {
      // await notificationService.showNotification({
      //     title: task.title,
      //     body: task.body,
      //     urgency: 'normal', // 默认使用普通紧急级别
      // });
      await notificationService.showWarning(task.title, task.body);
    } catch (error) {
      console.error("任务提醒通知失败:", error);
    }
  };

  const initializeTaskReminders = async () => {
    try {
      if (
        taskStore.taskTemplates.length === 0 &&
        taskStore.taskInstances.length === 0
      ) {
        console.warn("任务数据尚未加载，等待数据加载完成...");
        return;
      }

      await taskStore.initializeSchedules();

      cleanup = scheduleService.onScheduleTriggered(async ({ task }) => {
        if (task.type === "taskReminder") {
          await handleTaskReminderNotification(task.payload);
        }
      });
      isInitialized = true;
    } catch (error) {
      console.error("任务提醒初始化失败:", error);
    }
  };

  const stopWatcher = watch(
    () => taskStore.taskTemplates,
    async (newTemplates) => {
      if (newTemplates.length > 0 && !isInitialized) {
        await initializeTaskReminders();
      }
    },
    { immediate: true, deep: true }
  );

  if (autoInit) {
    onMounted(() => {
      initializeTaskReminders();
    });
  }

  onUnmounted(() => {
    if (cleanup) {
      cleanup();
    }
    stopWatcher();
  });

  return {
    initializeTaskReminders,
    isInitialized,
  }
}
