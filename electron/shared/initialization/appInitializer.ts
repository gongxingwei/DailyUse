import { InitializationManager, InitializationPhase, InitializationTask } from './initializationManager';
import { registerFileSystemHandlers } from '../ipc/filesystem';
import { registerGitHandlers } from '../ipc/git';
import { setupScheduleHandlers } from '../schedule/main';
import { setupNotificationHandler } from '../notification/ipcs/notification.ipc';

import { initializeEventSubscriptions } from './eventSubscriptionInitializer';
import { initializeDatabase } from '../../shared/database/index';
// 每个模块的初始化任务
import { registerSessionLoggingInitializationTasks } from '../../modules/SessionLogging/initialization/sessionLoggingInitialization';
import { registerAccountInitializationTasks } from '../../modules/Account/initialization/accountInitialization';
import { registerTaskInitializationTasks } from '../../modules/Task/initialization/taskInitialization';
import { registerGoalInitializationTasks } from '../../modules/goal/initialization/goalInitialization';
import { registerAuthenticationInitializationTasks } from '../../modules/Authentication/initialization/authenticationInitialization';
import { registerRepositoryInitializationTasks } from '../../modules/Repository/initialization/repositoryInitialization';
import { registerReminderInitializationTasks } from '../../modules/Reminder/initialization/reminderInitialization';

/**
 * 基础设施模块的初始化任务
 */
// 数据库初始化
const databaseInitTask: InitializationTask = {
  name: 'database',
  phase: InitializationPhase.APP_STARTUP,
  priority: 5,
  initialize: async () => {
    await initializeDatabase();
    console.log('✓ Database initialized');
  }
};


// 文件系统处理器
const fileSystemInitTask: InitializationTask = {
  name: 'filesystem',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  initialize: async () => {
    registerFileSystemHandlers();
    console.log('✓ Filesystem handlers registered');
  }
};

// Git 处理器
const gitInitTask: InitializationTask = {
  name: 'git',
  phase: InitializationPhase.APP_STARTUP,
  priority: 15,
  dependencies: ['filesystem'],
  initialize: async () => {
    registerGitHandlers();
    console.log('✓ Git handlers registered');
  }
};

// 通知服务
const notificationInitTask: InitializationTask = {
  name: 'notification',
  phase: InitializationPhase.APP_STARTUP,
  priority: 40,
  initialize: async () => {
    setupNotificationHandler();
    console.log('✓ Notification handlers registered');
  }
};

// 日程服务
const scheduleInitTask: InitializationTask = {
  name: 'schedule',
  phase: InitializationPhase.APP_STARTUP,
  priority: 45,
  dependencies: ['notification'],
  initialize: async () => {
    setupScheduleHandlers();
    console.log('✓ Schedule handlers registered');
  }
};

// 事件订阅
const eventSubscriptionInitTask: InitializationTask = {
  name: 'eventSubscription',
  phase: InitializationPhase.APP_STARTUP,
  priority: 50,
  dependencies: ['notification'],
  initialize: async () => {
    initializeEventSubscriptions();
    console.log('✓ Event subscriptions initialized');
  }
};

/**
 * 注册所有模块的初始化任务
 */
export function registerAllInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  
  // 注册基础设施任务
  manager.registerTask(databaseInitTask);
  manager.registerTask(fileSystemInitTask);
  manager.registerTask(gitInitTask);
  manager.registerTask(notificationInitTask);
  manager.registerTask(scheduleInitTask);
  manager.registerTask(eventSubscriptionInitTask);
  
  // 注册各模块的任务
  registerAccountInitializationTasks();
  registerTaskInitializationTasks();
  registerGoalInitializationTasks();
  registerAuthenticationInitializationTasks();
  registerSessionLoggingInitializationTasks();
  registerRepositoryInitializationTasks();
  registerReminderInitializationTasks();

  console.log('All initialization tasks registered');
}

/**
 * 应用启动时的初始化
 */
export async function initializeApp(): Promise<void> {
  console.log('Starting application initialization...');
  console.log('💫 [Debug] initializeApp() 调用堆栈:', new Error().stack);
  
  // 注册所有初始化任务
  registerAllInitializationTasks();
  
  // 执行应用启动阶段的初始化
  const manager = InitializationManager.getInstance();
  await manager.executePhase(InitializationPhase.APP_STARTUP);
  
  console.log('✓ Application initialization completed');
}

/**
 * 用户登录时的初始化
 */
export async function initializeUserSession(username: string): Promise<void> {
  console.log(`Initializing user session for: ${username}`);
  
  const manager = InitializationManager.getInstance();
  manager.setCurrentUser(username);
  
  // 执行用户登录阶段的初始化
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

/**
 * 应用关闭时的清理
 */
export async function cleanupApp(): Promise<void> {
  console.log('Cleaning up application...');
  
  const manager = InitializationManager.getInstance();
  
  // 清理所有阶段
  await manager.cleanupPhase(InitializationPhase.USER_LOGIN);
  await manager.cleanupPhase(InitializationPhase.APP_STARTUP);
  
  console.log('✓ Application cleanup completed');
}

/**
 * 获取初始化状态
 */
export function getInitializationStatus() {
  const manager = InitializationManager.getInstance();
  return manager.getModuleStatus();
}

/**
 * 检查特定任务是否已完成
 */
export function isTaskCompleted(taskName: string): boolean {
  const manager = InitializationManager.getInstance();
  return manager.isTaskCompleted(taskName);
}
