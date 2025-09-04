import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  console.log('Account module initialization tasks registered');
}
