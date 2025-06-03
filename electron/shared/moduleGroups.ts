import { setupUserHandlers } from '../modules/Account/ipcs/userIpc';
import { setupLoginSessionHandlers } from '../modules/Account/ipcs/loginSessionIpc';
import { StoreIpc } from '../modules/Account/ipcs/storeIpc';
import { registerFileSystemHandlers } from './ipc/filesystem';
import { registerGitHandlers } from './ipc/git';
import { setupScheduleHandlers } from '../modules/taskSchedule/main';
import { setupNotificationService } from '../modules/notification/notificationService';
import type { BrowserWindow } from 'electron';


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
export function setupWindowModules(
  win: BrowserWindow,
  MAIN_DIST: string,
  RENDERER_DIST: string,
  VITE_DEV_SERVER_URL?: string
): void {
  console.log('Setting up Window modules...');
  setupNotificationService(win, MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL);
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
export function initializeAllModules(
  win: BrowserWindow,
  MAIN_DIST: string,
  RENDERER_DIST: string,
  VITE_DEV_SERVER_URL?: string
): void {
  initializeBasicModules();
  setupWindowModules(win, MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL);
}