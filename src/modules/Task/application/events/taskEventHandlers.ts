import { eventBus } from '@common/shared/events/eventBus';
import type { TaskCompletedEvent } from '../../domain/events/taskEvents';

export class TaskEventHandlers {
  /**
   * 注册Task模块内部的事件处理器
   */
  static registerHandlers(): void {

    // 任务完成事件 - 内部处理
    eventBus.subscribe<TaskCompletedEvent>('TaskCompleted', async (event) => {
      console.log('Task模块处理任务完成事件:', event);
      
      
    });

  }
}