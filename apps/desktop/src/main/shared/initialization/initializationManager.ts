/**
 * 初始化管理器
 * 统一管理应用不同阶段的初始化逻辑
 *
 * 初始化阶段：
 * 1. APP_STARTUP - 应用启动时，在 app.whenReady() 后立即执行
 * 2. BEFORE_USER_LOGIN - 用户登录前的准备工作
 * 3. USER_LOGIN - 用户登录成功后执行
 * 4. USER_LOGOUT - 用户登出时执行
 * 5. APP_SHUTDOWN - 应用关闭前执行
 */

export enum InitializationPhase {
  APP_STARTUP = 'APP_STARTUP', // 应用启动
  BEFORE_USER_LOGIN = 'BEFORE_USER_LOGIN', // 登录前准备
  USER_LOGIN = 'USER_LOGIN', // 用户登录
  USER_LOGOUT = 'USER_LOGOUT', // 用户登出
  APP_SHUTDOWN = 'APP_SHUTDOWN', // 应用关闭
}

export interface InitializationTask {
  name: string;
  phase: InitializationPhase;
  priority: number; // 数字越小优先级越高
  dependencies?: string[]; // 依赖的其他任务名称
  initialize: (context?: any) => Promise<void>;
  cleanup?: () => Promise<void>;
}

export class InitializationManager {
  private static instance: InitializationManager;
  private tasks: Map<string, InitializationTask> = new Map();
  private completedTasks: Set<string> = new Set();
  private currentUser: string | null = null;

  private constructor() {}

  static getInstance(): InitializationManager {
    if (!InitializationManager.instance) {
      InitializationManager.instance = new InitializationManager();
    }
    return InitializationManager.instance;
  }

  /**
   * 注册初始化任务
   */
  registerTask(task: InitializationTask): void {
    this.tasks.set(task.name, task);
    console.log(`Registered initialization task: ${task.name} (${task.phase})`);
  }

  /**
   * 执行指定阶段的所有任务
   */
  async executePhase(phase: InitializationPhase, context?: any): Promise<void> {
    console.log(`Starting initialization phase: ${phase}`);

    const phaseTasks = Array.from(this.tasks.values())
      .filter((task) => task.phase === phase)
      .sort((a, b) => a.priority - b.priority);

    for (const task of phaseTasks) {
      await this.executeTask(task, context);
    }

    console.log(`Completed initialization phase: ${phase}`);
  }

  /**
   * 执行单个任务（处理依赖关系）
   */
  private async executeTask(task: InitializationTask, context?: any): Promise<void> {
    if (this.completedTasks.has(task.name)) {
      return; // 已经执行过了
    }

    // 检查依赖
    if (task.dependencies) {
      for (const depName of task.dependencies) {
        const depTask = this.tasks.get(depName);
        if (depTask && !this.completedTasks.has(depName)) {
          await this.executeTask(depTask, context);
        }
      }
    }

    try {
      console.log(`Executing initialization task: ${task.name}`);
      await task.initialize(context);
      this.completedTasks.add(task.name);
      console.log(`✓ Task completed: ${task.name}`);
    } catch (error) {
      console.error(`✗ Task failed: ${task.name}`, error);
      throw error;
    }
  }

  /**
   * 设置当前用户
   */
  setCurrentUser(username: string | null): void {
    this.currentUser = username;
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): string | null {
    return this.currentUser;
  }

  /**
   * 清理指定阶段的任务
   */
  async cleanupPhase(phase: InitializationPhase): Promise<void> {
    console.log(`Cleaning up phase: ${phase}`);

    const phaseTasks = Array.from(this.tasks.values())
      .filter((task) => task.phase === phase && task.cleanup)
      .sort((a, b) => b.priority - a.priority); // 清理时反向排序

    for (const task of phaseTasks) {
      try {
        if (task.cleanup) {
          console.log(`Cleaning up task: ${task.name}`);
          await task.cleanup();
          console.log(`✓ Task cleanup completed: ${task.name}`);
        }
      } catch (error) {
        console.error(`✗ Task cleanup failed: ${task.name}`, error);
      }
    }
  }

  /**
   * 重置管理器状态
   */
  reset(): void {
    this.completedTasks.clear();
    this.currentUser = null;
  }

  /**
   * 获取模块状态
   */
  getModuleStatus(): { [key: string]: { initialized: boolean; phase: string } } {
    const status: { [key: string]: { initialized: boolean; phase: string } } = {};

    for (const [name, task] of this.tasks) {
      status[name] = {
        initialized: this.completedTasks.has(name),
        phase: task.phase,
      };
    }

    return status;
  }

  /**
   * 检查特定任务是否已完成
   */
  isTaskCompleted(taskName: string): boolean {
    return this.completedTasks.has(taskName);
  }
}
