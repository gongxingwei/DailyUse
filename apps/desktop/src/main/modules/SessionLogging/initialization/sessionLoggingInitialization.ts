import { InitializationManager, InitializationPhase, InitializationTask } from '../../../shared/initialization/initializationManager';
import { SessionLoggingEventHandler } from '../../../modules/SessionLogging/application/eventHandlers/sessionLoggingEventHandler';
const SessionLoggingEventHandlerInitTask: InitializationTask = {
  name: 'session-logging-event-handler',
  phase: InitializationPhase.APP_STARTUP,
  priority: 1,
  dependencies: [],
  initialize: async () => {
    SessionLoggingEventHandler.registerHandlers();
  },
  cleanup: async () => {
    // Nothing to cleanup
  },
};

export function registerSessionLoggingInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(SessionLoggingEventHandlerInitTask);
  console.log('🚀！！，sessionLogging 模块的初始化任务注册了');
}
