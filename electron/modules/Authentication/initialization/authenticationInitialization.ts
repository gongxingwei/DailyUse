import { InitializationManager, InitializationPhase, InitializationTask } from '../../../shared/initialization/initializationManager';
import { AuthenticationIpcHandler } from '../infrastructure/ipc/authenticationIpcHandler';

const authenticationIpcInitTask: InitializationTask = {
  name: 'authentication-ipc-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 10,
  dependencies: [],
  initialize: async () => {
    await AuthenticationIpcHandler.registerIpcHandlers();
    console.log('✓ Authentication IPC handlers registered');
  }
};


export function registerAuthenticationInitializationTasks(): void { 
    const manager = InitializationManager.getInstance();
    manager.registerTask(authenticationIpcInitTask);
    console.log('Authentication module initialization tasks registered');
    
}
