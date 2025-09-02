import { InitializationManager, InitializationPhase, type InitializationTask } from '@dailyuse/utils';
import { registerAuthenticationEventHandler } from '../application/events/EventHandler';


const authenticationEventHandlersInitTask: InitializationTask = {
  name: 'authentication-event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  dependencies: [],
  initialize: async () => {
    await registerAuthenticationEventHandler();
    console.log('✓ Authentication event handlers registered');
  }
};


export function registerAuthenticationInitializationTasks(): void { 
    const manager = InitializationManager.getInstance();
    manager.registerTask(authenticationEventHandlersInitTask);
    console.log('Authentication module initialization tasks registered'); 
}
