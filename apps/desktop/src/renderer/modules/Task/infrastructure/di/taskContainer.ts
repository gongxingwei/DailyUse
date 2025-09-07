import { useTaskStore } from '../../presentation/stores/taskStore';

/**
 * Task 模块依赖注入容器 (渲染进程简化版)
 * 
 * 新架构设计：
 * - Application Service 直接调用 IPC，不再需要仓库抽象
 * - Store 仅做状态管理，由 Application Service 同步
 * - 容器只负责提供 Store 实例
 */
export class TaskContainer {
  private static instance: TaskContainer;
  private taskStore = useTaskStore();

  private constructor() {}

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  /**
   * 获取 Task Store 实例
   * Store 仅用于状态管理，不处理持久化
   */
  getTaskStore() {
    return this.taskStore;
  }

  /**
   * 重置容器（主要用于测试）
   */
  static reset(): void {
    TaskContainer.instance = undefined as any;
  }
}
