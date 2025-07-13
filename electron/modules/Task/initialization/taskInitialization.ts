import { InitializationManager, InitializationPhase, InitializationTask } from '../../../shared/initialization/initializationManager';
import { TaskIpcHandler } from '../ipc/taskIpcHandler';
import { MainTaskApplicationService } from '../application/mainTaskApplicationService';
import { TaskContainer } from '../infrastructure/di/taskContainer';

/**
 * 任务模块的初始化任务定义
 */

// IPC 处理器初始化任务（应用启动时执行）
const taskIpcInitTask: InitializationTask = {
  name: 'task-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 50,
  dependencies: ['filesystem'],
  initialize: async () => {
    const taskIpcHandler = new TaskIpcHandler();
    taskIpcHandler.register();
    console.log('✓ Task IPC handlers registered');
  }
};

// 系统模板初始化任务（用户登录时执行）
const taskSystemTemplatesInitTask: InitializationTask = {
  name: 'task-system-templates',
  phase: InitializationPhase.USER_LOGIN,
  priority: 10,
  initialize: async (context: { username: string }) => {
    if (!context?.username) {
      throw new Error('Username is required for task system templates initialization');
    }

    // 设置当前用户到任务容器
    const taskContainer = TaskContainer.getInstance();
    taskContainer.setCurrentUser(context.username);

    // 初始化系统模板
    const mainTaskAppService = new MainTaskApplicationService();
    const result = await mainTaskAppService.initializeSystemTemplates();
    
    if (!result.success) {
      throw new Error(`Failed to initialize system templates: ${result.message}`);
    }
    
    console.log(`✓ Task system templates initialized for user: ${context.username}`);
  },
  cleanup: async () => {
    // 用户登出时清理
    console.log('Cleaning up task module user data...');
  }
};

/**
 * 注册所有任务模块的初始化任务
 */
export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  
  manager.registerTask(taskIpcInitTask);
  manager.registerTask(taskSystemTemplatesInitTask);
  
  console.log('【主进程::Task 模块】 初始化任务已注册');
}

/**
 * 任务模块的清理函数
 */
export function cleanupTaskModule(): void {
  console.log('Cleaning up Task module...');
  // 这里可以添加清理逻辑，如关闭数据库连接、清理定时器等
  console.log('✓ Task module cleaned up');
}
