// src/modules/Goal/services/goalEventHandlers.ts
import { EventBus } from '@/shared/events/eventBus';
import type { TaskCompletedEvent, TaskUndoCompletedEvent } from '@/shared/events/domainEvent';
import { goalService } from './goalService';
export class GoalEventHandlers {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    const eventBus = EventBus.getInstance();

    // 监听任务完成事件
    eventBus.subscribe<TaskCompletedEvent>('TaskCompleted', async (event) => {
      for (const link of event.data.keyResultLinks) {
        await goalService.updateKeyResultCurrentValue(
          link.goalId,
          link.keyResultId,
          link.incrementValue
        );
        console.log(`任务完成事件：更新关键结果 ${link.keyResultId}，增加值 ${link.incrementValue}`);
      }
    });

    // 监听任务撤销事件
    eventBus.subscribe<TaskUndoCompletedEvent>('TaskUndoCompleted', async (event) => {
      for (const link of event.data.keyResultLinks) {
         await goalService.updateKeyResultCurrentValue(
          link.goalId,
          link.keyResultId,
          link.incrementValue
        );
        console.log(`任务撤销事件：回退关键结果 ${link.keyResultId}，减少值 ${link.incrementValue}`);
      }
    });

    this.initialized = true;
  }
}