import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
import { scheduleService } from '@/modules/schedule/services/scheduleService';
import { notificationService } from '@/modules/notification/services/notificationService';

export class TaskReminderInitService {
  private static cleanup: (() => void) | null = null;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('任务提醒系统已经初始化');
      return;
    }

    try {
      const taskStore = useTaskStore();

      if (taskStore.taskTemplates.length === 0 && taskStore.taskInstances.length === 0) {
        console.warn('任务数据尚未加载，等待数据加载完成...');
        return;
      }

      console.log(`开始初始化任务提醒... 模板数量: ${taskStore.taskTemplates.length}, 实例数量: ${taskStore.taskInstances.length}`);
      
      await taskStore.initializeSchedules();
      // 创建观察者
      this.cleanup = scheduleService.onScheduleTriggered(({ task }) => {
        if (task.type === 'taskReminder') {
          this.handleTaskReminderNotification(task.payload);
        }
      });

      this.isInitialized = true;
      console.log('任务提醒系统初始化完成');
    } catch (error) {
      console.error('任务提醒系统初始化失败:', error);
      throw error;
    }
  }

  private static async handleTaskReminderNotification(payload: { 
    title: string; 
    body: string; 
  }): Promise<void> {
    try {
      await notificationService.showNotification({
        title: payload.title,
        body: payload.body,
        urgency: 'normal',
        actions: [
          { text: '查看任务', type: 'action' },
          { text: '稍后提醒', type: 'action' },
          { text: '忽略', type: 'cancel' }
        ]
      });
    } catch (error) {
      console.error('显示任务提醒失败:', error);
    }
  }

  static destroy(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    this.isInitialized = false;
    console.log('任务提醒系统已清理');
  }

  static isReady(): boolean {
    return this.isInitialized;
  }
}