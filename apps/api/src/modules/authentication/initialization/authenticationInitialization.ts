import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { registerAuthenticationEventHandler } from '../application/events/EventHandler';
import { initializeAuthenticationRequestHandlers } from '../application/handlers/AuthenticationRequestHandlers';

const authenticationEventHandlersInitTask: InitializationTask = {
  name: 'authentication-event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  dependencies: [],
  initialize: async () => {
    await registerAuthenticationEventHandler();
    console.log('✓ Authentication event handlers registered');
  },
};

const authenticationRequestHandlersInitTask: InitializationTask = {
  name: 'authentication-request-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  dependencies: [],
  initialize: async () => {
    console.log('[authentication:RequestHandlers] Registering EventEmitter request handlers...');
    initializeAuthenticationRequestHandlers();
    console.log('✅ Authentication EventEmitter request handlers registered successfully');
    console.log('✓ Authentication EventEmitter request handlers registered');
  },
};

export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(authenticationEventHandlersInitTask);
  manager.registerTask(authenticationRequestHandlersInitTask);
  console.log('Authentication module initialization tasks registered');
}
