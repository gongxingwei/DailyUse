// goalEventHandlers.ts
import { EventBus } from '@/shared/events/eventBus';
import type { TaskCompletedEvent, TaskUndoCompletedEvent } from '@/shared/domain/domainEvent';
import { GoalApplicationService } from '../../application/services/goalApplicationService';

export class GoalEventHandlers {
  private static goalApplicationService: GoalApplicationService | null = null;

  // 延迟获取服务实例
  private static getGoalService(): GoalApplicationService {
    if (!this.goalApplicationService) {
      this.goalApplicationService = new GoalApplicationService();
    }
    return this.goalApplicationService;
  }

  static registerHandlers(): void {
    const eventBus = EventBus.getInstance();

    eventBus.subscribe<TaskCompletedEvent>('TaskCompleted', async (event) => {
      console.log('Goal模块处理任务完成事件:', event);
      
      if (event.payload.keyResultLinks?.length) {
        // 在这里才创建服务实例，此时 Pinia 已经初始化
        const goalApplicationService = GoalEventHandlers.getGoalService();
        
        for (const link of event.payload.keyResultLinks) {
          await goalApplicationService.addRecordAboutTaskInstanceComplete(
            link.goalId, 
            link.keyResultId, 
            link.incrementValue
          );
        }
      }
    });

    eventBus.subscribe<TaskUndoCompletedEvent>('TaskUndoCompleted', async (event) => {
      console.log('Goal模块处理任务撤销完成事件:', event);
      
      if (event.payload.keyResultLinks?.length) {
        const goalApplicationService = GoalEventHandlers.getGoalService();
        
        for (const link of event.payload.keyResultLinks) {
          await goalApplicationService.addRecordAboutTaskInstanceComplete(
            link.goalId, 
            link.keyResultId, 
            -link.incrementValue
          );
        }
      }
    });
  }

  // 清理方法
  static cleanup(): void {
    this.goalApplicationService = null;
  }
}