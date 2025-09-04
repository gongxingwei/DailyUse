import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';




export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  console.log('Authentication module initialization tasks registered');
}
