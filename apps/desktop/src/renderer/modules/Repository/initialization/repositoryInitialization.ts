import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from '@main/shared/initialization/initializationManager';
import { getRepositoryApplicationService } from '../application/services/repositoryApplicationService';

const repositorySyncStatusRask: InitializationTask = {
  name: 'repository-sync-status',
  phase: InitializationPhase.USER_LOGIN,
  priority: 20,
  dependencies: [],
  initialize: async () => {
    // 初始化仓库同步状态处理器
    const repositoryService = getRepositoryApplicationService();
    repositoryService.syncAllState();
    console.log('✓ Repository sync status handlers registered');
  },
};

export function registerRepositoryInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(repositorySyncStatusRask);

  console.log('Repository module initialization tasks registered');
}
