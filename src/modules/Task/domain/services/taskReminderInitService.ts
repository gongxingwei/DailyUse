import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
import { scheduleService } from '@/modules/schedule/services/scheduleService';
import { notificationService } from '@/modules/notification/services/notificationService';

/**
 * 任务提醒初始化服务
 * 
 * 职责：
 * - 初始化任务实例的提醒系统
 * - 监听和处理提醒触发事件
 * - 管理提醒系统的生命周期
 * 
 * 注意：
 * - TaskTemplate（任务模板）：定义可重复使用的任务配置模板
 * - TaskInstance（任务实例）：基于模板创建的具体任务执行实例，具有确切的执行时间
 * - 此服务主要处理TaskInstance的提醒，因为只有具体的实例才需要在特定时间提醒
 */
export class TaskReminderInitService {
  private static cleanup: (() => void) | null = null;
  private static isInitialized = false;

  /**
   * 初始化任务提醒系统
   * 
   * 工作流程：
   * 1. 检查是否已初始化，避免重复初始化
   * 2. 验证任务数据是否加载完成
   * 3. 为所有TaskInstance创建提醒调度
   * 4. 注册提醒事件监听器
   */
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

  /**
   * 处理任务提醒通知
   * 
   * @param payload - 提醒通知载荷，包含标题和内容
   * @param payload.title - 提醒标题
   * @param payload.body - 提醒内容
   */
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

  /**
   * 销毁提醒系统
   * 清理所有监听器和状态
   */
  static destroy(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    this.isInitialized = false;
    console.log('任务提醒系统已清理');
  }

  /**
   * 检查提醒系统是否已准备就绪
   * 
   * @returns {boolean} 是否已初始化
   */
  static isReady(): boolean {
    return this.isInitialized;
  }
}