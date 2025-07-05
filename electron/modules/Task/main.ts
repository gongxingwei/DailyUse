import { TaskIpcHandler } from './ipc/taskIpcHandler';

/**
 * 初始化主进程中的任务模块
 * 注册所有 IPC 处理器
 */
export function initializeTaskModule(): void {
  console.log('Initializing Task module in main process...');
  
  try {
    // 注册 IPC 处理器
    const taskIpcHandler = new TaskIpcHandler();
    taskIpcHandler.register();
    
    console.log('✓ Task module initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize Task module:', error);
    throw error;
  }
}

/**
 * 任务模块的清理函数
 * 在应用退出时调用
 */
export function cleanupTaskModule(): void {
  console.log('Cleaning up Task module...');
  // 这里可以添加清理逻辑，如关闭数据库连接、清理定时器等
  console.log('✓ Task module cleaned up');
}
