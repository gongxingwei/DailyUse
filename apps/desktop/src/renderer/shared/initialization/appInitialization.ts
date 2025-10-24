import {
  InitializationManager,
  InitializationPhase,
} from '@main/shared/initialization/initializationManager';
// 渲染进程各个模块的初始化任务
import { registerAccountInitializationTasks } from '@renderer/modules/Account/initialization/accountInitialization';
import { registerTaskInitializationTasks } from '@renderer/modules/Task/initialization/taskInitialization';
// import { registerPatchIpcRendererInvokeWithAuthTask } from "@renderer/shared/initialization/patchIpcRenderer";
import { registerInitializationEventsTask } from '@renderer/shared/initialization/application/events/initializationEventHandlers';
import { registerMainWindowInitTask } from './mainWindowInit/mainWindowInit';
import { registerGoalInitializationTasks } from '@renderer/modules/Goal';
import { registerRenderReminderInitializationTasks } from '@renderer/modules/Reminder/initialization/RenderReminderInitialization';
import { registerRepositoryInitializationTasks } from '@renderer/modules/Repository/initialization/repositoryInitialization';

export function registerAllInitializationTasks(): void {
  registerAccountInitializationTasks();
  registerTaskInitializationTasks();
  registerGoalInitializationTasks();
  registerMainWindowInitTask();

  registerInitializationEventsTask();
  registerRenderReminderInitializationTasks();
  registerRepositoryInitializationTasks();

  console.log('成功注册所有模块任务');
}

/**
 * 应用启动时的初始化
 */
export async function initializeApp(): Promise<void> {
  console.log('Starting rendered process application initialization...');
  console.log('💫 [Debug] initializeApp() 调用堆栈:', new Error().stack);

  // 注册所有初始化任务
  registerAllInitializationTasks();

  // 执行应用启动阶段的初始化
  const manager = InitializationManager.getInstance();
  await manager.executePhase(InitializationPhase.APP_STARTUP);
}

/**
 * 用户登录时的初始化
 */
export async function initializeUserSession(accountUuid: string): Promise<void> {
  console.log('{渲染进程} 启动用户会话初始化...');
  const manager = InitializationManager.getInstance();
  manager.setCurrentUser(accountUuid);
  await manager.executePhase(InitializationPhase.USER_LOGIN, { accountUuid });
  console.log(`✓ User session initialized for: ${accountUuid}`);
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
