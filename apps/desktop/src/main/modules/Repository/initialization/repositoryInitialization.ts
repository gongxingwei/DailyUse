import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from '../../../shared/initialization/initializationManager';
import { RepositoryIpcHandler } from '../infrastructure/ipc/repositoryIpcHandler';

const repositoryIpcInitTask: InitializationTask = {
  name: 'repository-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  dependencies: [],
  initialize: async () => {
    // 初始化仓库模块的 IPC 处理器
    RepositoryIpcHandler.registerHandlers();
    console.log('✓ Repository IPC handlers registered');
  },
};

export function registerRepositoryInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(repositoryIpcInitTask);

  console.log('Repository module initialization tasks registered');
}
