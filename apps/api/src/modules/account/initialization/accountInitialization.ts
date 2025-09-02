import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { registerAccountEventHandlers } from '../application/events';

const accountEventHandlersTask: InitializationTask = {
  name: 'account-event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  dependencies: [],
  initialize: async () => {
    await registerAccountEventHandlers();
    console.log('✓ Account event handlers registered');
  },
};

export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(accountEventHandlersTask);
  console.log('Account module initialization tasks registered');
}
