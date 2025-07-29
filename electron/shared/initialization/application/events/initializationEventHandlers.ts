import { eventBus } from "@electron/shared/events/eventBus";
import type {
  UserLoggedInEvent,
} from "@electron/modules/Authentication/domain/events/authenticationEvents";
import { cleanupUserSession, initializeUserSession } from "../../appInitializer";
import {
  InitializationManager,
  InitializationPhase,
  InitializationTask,
} from "@electron/shared/initialization/initializationManager";

/**
 * 初始化 初始化事件的事件处理器
 * 初始化模块 注册 监听用户登录事件的处理器，来执行需要在用户登录时初始化的任务
 */
export class InitializationEventHandlers {
  static registerInitializationEventHandlers() {
    // 注册用户登录事件处理器
    eventBus.subscribe<UserLoggedInEvent>(
      "UserLoggedIn",
      InitializationEventHandlers.handleUserLoggedInEvent
    );
    console.log("✅ [主进程Initialization] 注册用户登录事件处理器");
  }
  // 处理用户登录事件
  static async handleUserLoggedInEvent(event: UserLoggedInEvent) {
    const { accountUuid } = event.payload;
    console.log(
      "🟢 [主进程Initialization] 检测到用户登录事件，开始初始化用户数据:",
      accountUuid
    );
    await initializeUserSession(accountUuid);
  }

  static async handleUserLoggedOutEvent(event: UserLoggedInEvent) {
    const { accountUuid } = event.payload;
    console.log(
      "🔴 [主进程Initialization] 检测到用户登出事件，开始清理用户数据:",
      accountUuid
    );
    await cleanupUserSession();
  }

}




const initializationEventHandlersTask: InitializationTask = {
  name: "InitializationEventHandlers",
  phase: InitializationPhase.APP_STARTUP,
  priority: 1,
  initialize: async () => {
    InitializationEventHandlers.registerInitializationEventHandlers();
  }
};

export const registerInitializationEventsTask = () => {
  const manager = InitializationManager.getInstance();
  manager.registerTask(initializationEventHandlersTask);
};
