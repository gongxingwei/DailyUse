import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { registerAccountEventHandlers } from '../application/events';
import { registerAccountRequestHandlers } from '../application/events/eventEmitterHandlers';

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

const accountRequestHandlersTask: InitializationTask = {
  name: 'account-request-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  dependencies: [],
  initialize: async () => {
    await registerAccountRequestHandlers();
    console.log('✓ Account EventEmitter request handlers registered');
  },
};

export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(accountEventHandlersTask);
  manager.registerTask(accountRequestHandlersTask);
  console.log('Account module initialization tasks registered');
}
