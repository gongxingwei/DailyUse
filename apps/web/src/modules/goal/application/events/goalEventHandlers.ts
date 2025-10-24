// ⚠️ 此文件已弃用
// Goal 事件处理器已移动到主进程
// 请使用: d:\myPrograms\DailyUse\electron\modules\goal\infrastructure\events\goalEventHandlers.ts

/**
 * @deprecated 此文件已弃用，事件处理逻辑已移动到主进程
 *
 * 原因：
 * 1. 事件处理应该在主进程统一管理
 * 2. 避免渲染进程和主进程之间的数据同步问题
 * 3. 提高性能，减少 IPC 通信
 * 4. 保持架构的一致性
 *
 * 新的事件处理器位置：
 * electron/modules/goal/infrastructure/events/goalEventHandlers.ts
 */

console.warn('⚠️ [弃用警告] Goal 事件处理器已移动到主进程，请更新相关代码引用');

export class GoalEventHandlers {
  static registerHandlers(): void {
    console.warn('⚠️ 渲染进程的 Goal 事件处理器已弃用，请使用主进程版本');
  }

  static cleanup(): void {
    console.warn('⚠️ 渲染进程的 Goal 事件处理器已弃用，请使用主进程版本');
  }
}
