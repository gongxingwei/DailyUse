import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from "@electron/shared/initialization/initializationManager";

import { TaskEventHandlers } from "../application/events/taskEventHandlers";

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


export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(taskEventHandlersInitTask);
  console.log('【渲染进程-任务模块】初始化任务注册完成')
}