import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from "@electron/shared/initialization/initializationManager";
// 渲染进程各个模块的初始化任务
import { registerAccountInitializationTasks } from "@/modules/Account/initialization/accountInitialization";
import { registerTaskInitializationTasks } from "@/modules/Task/initialization/taskInitialization";
export function registerAllInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  registerAccountInitializationTasks();
  registerTaskInitializationTasks();
  console.log(
    "渲染进程：Authentication module initialization tasks registered"
  );
}

/**
 * 应用启动时的初始化
 */
export async function initializeApp(): Promise<void> {
  console.log("Starting rendered process application initialization...");
  console.log("💫 [Debug] initializeApp() 调用堆栈:", new Error().stack);

  // 注册所有初始化任务
  registerAllInitializationTasks();
  
  
  // 执行应用启动阶段的初始化
  const manager = InitializationManager.getInstance();
  await manager.executePhase(InitializationPhase.APP_STARTUP);
}

/**
 * 用户登录时的初始化
 */
export async function initializeUserSession(username: string): Promise<void> {
  console.log("{渲染进程} 启动用户会话初始化...");
  const manager = InitializationManager.getInstance();
  manager.setCurrentUser(username);
  await manager.executePhase(InitializationPhase.USER_LOGIN, { username });
  console.log(`✓ User session initialized for: ${username}`);
}

/**
 * 用户登出时的清理
 */
export async function cleanupUserSession(): Promise<void> {
  console.log('Cleaning up user session...');
  
  const manager = InitializationManager.getInstance();
  
  // 执行用户登出阶段的清理
  await manager.cleanupPhase(InitializationPhase.USER_LOGIN);
  
  manager.setCurrentUser(null);
  
  console.log('✓ User session cleaned up');
}
