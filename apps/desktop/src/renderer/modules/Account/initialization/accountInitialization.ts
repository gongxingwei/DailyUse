import { InitializationManager, InitializationPhase, InitializationTask } from '@main/shared/initialization/initializationManager';

// eventHandlers
import { AccountEventHandlers } from '../application/events/accountEventHandlers';

const accountEventHandlersInitTask: InitializationTask = {
  name: 'src-accountEventHandlersInitTask',
  phase: InitializationPhase.APP_STARTUP,
  priority: 1,
  dependencies: [''],
  initialize: async () => {
    AccountEventHandlers.registerHandlers();
    console.log('✓ renderedProcess Account event handlers registered');
  }
};



export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(accountEventHandlersInitTask);
  console.log('Account module initialization tasks registered')
}
