import { TaskEventHandlers } from '@/modules/Task/infrastructure/events/taskEventHandlers';
import { GoalEventHandlers } from '@/modules/Goal/infrastructure/events/goalEventHandlers';
import { CrossModuleEventHandlers } from '@/shared/infrastructure/eventHandlers/crossModuleEventHandlers';
import { EventBus } from '@/shared/events/eventBus';

/**
 * 事件系统
 * 
 * 职责：
 * - 初始化和清理事件系统
 * - 注册各模块的事件处理器
 * - 提供全局事件总线
 * 
 * 说明：
 * - 事件系统用于模块间通信和解耦
 * - 支持跨模块事件处理
 */
export class EventSystem {
  /**
   * 初始化整个事件系统
   */
  static initialize(): void {
    console.log('初始化事件系统...');

    // 注册各模块的事件处理器
    TaskEventHandlers.registerHandlers();
    GoalEventHandlers.registerHandlers();
    
    // 注册跨模块事件处理器
    CrossModuleEventHandlers.registerHandlers();

    console.log('事件系统初始化完成');
  }

  /**
   * 清理事件系统（用于测试或应用关闭）
   */
  static cleanup(): void {
    const eventBus = EventBus.getInstance();
    eventBus.clearHandlers();
    console.log('事件系统已清理');
  }
}