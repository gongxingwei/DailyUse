import { setupUserHandlers } from '../modules/Account/ipcs/userIpc';
import { setupLoginSessionHandlers } from '../modules/Account/ipcs/loginSessionIpc';
import { StoreIpc } from '../modules/Account/ipcs/storeIpc';
import { registerFileSystemHandlers } from './ipc/filesystem';
import { registerGitHandlers } from './ipc/git';
import { setupScheduleHandlers } from '../modules/schedule/main';
import { setupNotificationHandler } from '../modules/notification/ipcs/notification.ipc';

/**
 * 账户相关模块
 */
export function setupAccountModules(): void {
  console.log('Setting up Account modules...');
  setupUserHandlers();
  setupLoginSessionHandlers();
  StoreIpc.registerHandlers();
  console.log('✓ Account modules ready');
}

/**
 * 共享功能模块
 */
export function setupSharedModules(): void {
  console.log('Setting up Shared modules...');
  registerFileSystemHandlers();
  registerGitHandlers();
  console.log('✓ Shared modules ready');
}

/**
 * 窗口相关模块
 */
export function setupWindowModules(): void {
  console.log('Setting up Window modules...');
  setupNotificationHandler();
  setupScheduleHandlers();
  console.log('✓ Window modules ready');
}

/**
 * 初始化所有基础模块
 */
export function initializeBasicModules(): void {
  setupSharedModules();
  setupAccountModules();
}

/**
 * 初始化所有模块
 */
export function initializeAllModules(): void {
  initializeBasicModules();
  setupWindowModules();
}