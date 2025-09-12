import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from "@main/shared/initialization/initializationManager";

import { TaskEventHandlers } from "../application/events/taskEventHandlers";
import { getTaskDomainApplicationService } from "../application/services/taskDomainApplicationService";

const taskDomainApplicationService = getTaskDomainApplicationService();

const taskEventHandlersInitTask = {
  name: "rendered-process-task-event-handlers-init-task",
  phase: InitializationPhase.APP_STARTUP,
  priority: 1,
  dependencies: [],
  initialize: async () => {
    console.log("taskEventHandlersInitTask");
    TaskEventHandlers.registerHandlers();
  },
};

const taskSyncStateTask: InitializationTask = {
  name: "rendered-process-task-sync-state-task",
  phase: InitializationPhase.USER_LOGIN,
  priority: 2,
  dependencies: [],
  initialize: async () => {
    console.log("taskSyncStateTask");
    await taskDomainApplicationService.syncAllData();
  },
};

export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(taskEventHandlersInitTask);
  manager.registerTask(taskSyncStateTask);
  console.log('【渲染进程-任务模块】初始化任务注册完成')
}
