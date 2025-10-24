import {
  InitializationTask,
  InitializationPhase,
  InitializationManager,
} from '@main/shared/initialization/initializationManager';
import { getGoalDomainApplicationService } from '../application/services/goalDomainApplicationService';

const goalService = getGoalDomainApplicationService();

const goalStateSyncTask: InitializationTask = {
  name: 'GoalStateSync',
  phase: InitializationPhase.USER_LOGIN,
  priority: 10,
  initialize: async () => {
    console.log('🔄 [目标状态同步] 开始同步目标状态');
    await goalService.syncAllData();
    console.log('✅ [目标状态同步] 同步完成');
  },
};

export function registerGoalInitializationTasks() {
  const manager = InitializationManager.getInstance();
  manager.registerTask(goalStateSyncTask);
  console.log('✅ [目标初始化] 注册目标状态同步任务');
}
