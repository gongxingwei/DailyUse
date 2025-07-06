import { initializeTaskModule as newInitializeTaskModule, initializeTaskModuleForUser as newInitializeTaskModuleForUser } from './initialization/taskInitialization';

/**
 * 初始化主进程中的任务模块
 * 注册所有 IPC 处理器，但不初始化系统模板（需要用户登录后才初始化）
 * 
 * @deprecated 建议使用新的初始化管理系统
 */
export async function initializeTaskModule(): Promise<void> {
  console.log('Initializing Task module (legacy method)...');
  await newInitializeTaskModule();
}

/**
 * 用户登录时的任务模块初始化
 * 设置当前用户并初始化系统模板
 * 
 * @deprecated 建议使用新的初始化管理系统
 */
export async function initializeTaskModuleForUser(username: string): Promise<void> {
  console.log(`Initializing Task module for user: ${username} (legacy method)...`);
  await newInitializeTaskModuleForUser(username);
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
