import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from "@main/shared/initialization/initializationManager";
import { getReminderDomainApplicationService } from "../application/services/reminderApplicationService";

const reminderAppService = getReminderDomainApplicationService();

/**
 * Reminder 模块初始化任务定义
 */
const renderReminderSyncStateTask: InitializationTask = {
  name: "render-reminder-sync-state",
    phase: InitializationPhase.USER_LOGIN,
    priority: 10,
    initialize: async () => {
      console.log("【渲染进程 Reminder 模块】开始同步提醒状态");
      await reminderAppService.syncAllReminderGroups();

      console.log("【渲染进程 Reminder 模块】提醒状态同步完成");
    },
}

export function registerRenderReminderInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(renderReminderSyncStateTask);

  console.log("🚀【渲染进程::Reminder 模块】初始化任务注册完成");
}
