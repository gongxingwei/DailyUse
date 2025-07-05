import { Module, moduleRegistry } from './moduleRegistry';

// 导入各模块的初始化函数
import { setupUserHandlers } from '../modules/Account/ipcs/userIpc';
import { setupLoginSessionHandlers } from '../modules/Account/ipcs/loginSessionIpc';
import { StoreIpc } from '../modules/Account/ipcs/storeIpc';
import { registerFileSystemHandlers } from './ipc/filesystem';
import { registerGitHandlers } from './ipc/git';
import { setupScheduleHandlers } from '../modules/schedule/main';
import { setupNotificationHandler } from '../modules/notification/ipcs/notification.ipc';
import { initializeTaskModule, cleanupTaskModule } from '../modules/Task/main';

/**
 * 所有模块的定义
 * 按功能分组，明确依赖关系和优先级
 */

// ===== 基础设施模块 =====
const fileSystemModule: Module = {
  name: 'filesystem',
  initialize: registerFileSystemHandlers,
  priority: 10
};

const gitModule: Module = {
  name: 'git',
  initialize: registerGitHandlers,
  priority: 15
};

// ===== 账户模块 =====
const userModule: Module = {
  name: 'user',
  initialize: setupUserHandlers,
  dependencies: ['filesystem'],
  priority: 20
};

const loginSessionModule: Module = {
  name: 'loginSession',
  initialize: setupLoginSessionHandlers,
  dependencies: ['user'],
  priority: 25
};

const storeModule: Module = {
  name: 'store',
  initialize: () => StoreIpc.registerHandlers(),
  dependencies: ['user'],
  priority: 30
};

// ===== 系统服务模块 =====
const notificationModule: Module = {
  name: 'notification',
  initialize: setupNotificationHandler,
  priority: 40
};

const scheduleModule: Module = {
  name: 'schedule',
  initialize: setupScheduleHandlers,
  dependencies: ['notification'],
  priority: 45
};

// ===== 业务模块 =====
const taskModule: Module = {
  name: 'task',
  initialize: initializeTaskModule,
  cleanup: cleanupTaskModule,
  dependencies: ['filesystem', 'notification', 'schedule'],
  priority: 50
};

// 将来可以添加更多模块
// const goalModule: Module = {
//   name: 'goal',
//   initialize: initializeGoalModule,
//   cleanup: cleanupGoalModule,
//   dependencies: ['task'],
//   priority: 60
// };

// const habitModule: Module = {
//   name: 'habit',
//   initialize: initializeHabitModule,
//   cleanup: cleanupHabitModule,
//   dependencies: ['task'],
//   priority: 60
// };

/**
 * 注册所有模块
 */
export function registerAllModules(): void {
  console.log('🔧 Starting module registration...');
  
  const modules: Module[] = [
    // 基础设施
    fileSystemModule,
    gitModule,
    
    // 账户系统
    userModule,
    loginSessionModule,
    storeModule,
    
    // 系统服务
    notificationModule,
    scheduleModule,
    
    // 业务模块
    taskModule,
    
    // 将来的模块...
    // goalModule,
    // habitModule,
  ];

  console.log(`📦 Registering ${modules.length} modules:`, modules.map(m => m.name));
  moduleRegistry.registerAll(modules);
  console.log('✅ Module registration completed');
}

/**
 * 初始化所有模块
 */
export async function initializeAllModules(): Promise<void> {
  console.log('🚀 initializeAllModules called from moduleManager');
  registerAllModules();
  await moduleRegistry.initializeAll();
}

/**
 * 清理所有模块
 */
export async function cleanupAllModules(): Promise<void> {
  await moduleRegistry.cleanupAll();
}

/**
 * 获取模块状态
 */
export function getModuleStatus() {
  return moduleRegistry.getModuleStatus();
}

/**
 * 检查特定模块是否已初始化
 */
export function isModuleReady(moduleName: string): boolean {
  return moduleRegistry.isModuleInitialized(moduleName);
}

// 导出模块注册表以供调试使用
export { moduleRegistry };
