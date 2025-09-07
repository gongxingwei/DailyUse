import { eventBus } from "@dailyuse/utils";
import { AuthenticationEventHandler } from "../../modules/Authentication/application/eventHandlers/authenticationEventHandler";
import { RepositoryFactory } from "../services/repositoryFactory";
import { AccountRegisteredEvent } from "../../modules/Account/domain/events/accountEvents";

/**
 * 主进程事件订阅初始化器
 * 负责设置各模块间的事件监听关系
 */
export class EventSubscriptionInitializer {
  
  /**
   * 初始化所有事件订阅
   */
  static initialize(): void {
    console.log('🔧 [EventSubscription] 开始初始化事件订阅');

    // 初始化 Authentication 模块的事件处理器
    this.initializeAuthenticationEventHandlers();

    // 初始化 SessionLogging 模块的事件处理器
    // this.initializeSessionLoggingEventHandlers();

    console.log('✅ [EventSubscription] 事件订阅初始化完成');
  }

  /**
   * 初始化 Authentication 模块的事件处理器
   */
  private static initializeAuthenticationEventHandlers(): void {
    try {
      // 获取 AuthCredential 仓库
      const authCredentialRepository = RepositoryFactory.getAuthCredentialRepository();
      
      // 创建事件处理器
      const authEventHandler = new AuthenticationEventHandler(authCredentialRepository);

      // 订阅 AccountRegistered 事件
      eventBus.subscribe('AccountRegistered', async (event: AccountRegisteredEvent) => {
        await authEventHandler.handleAccountRegistered(event);
      });

      console.log('🔐 [EventSubscription] Authentication 模块事件处理器初始化完成');
    } catch (error) {
      console.error('❌ [EventSubscription] Authentication 模块事件处理器初始化失败:', error);
    }
  }

  // /**
  //  * 初始化 SessionLogging 模块的事件处理器
  //  */
  // private static initializeSessionLoggingEventHandlers(): void {
  //   try {
  //     // TODO: 实现 SessionLogging 模块的事件处理器
  //     // 例如：监听 AccountRegistered 事件来记录注册行为
      
  //     // eventBus.subscribe('AccountRegistered', async (event) => {
  //     //   await sessionLoggingEventHandler.handleAccountRegistered(event);
  //     // });

  //     console.log('📝 [EventSubscription] SessionLogging 模块事件处理器初始化完成');
  //   } catch (error) {
  //     console.error('❌ [EventSubscription] SessionLogging 模块事件处理器初始化失败:', error);
  //   }
  // }

  /**
   * 清理所有事件订阅
   */
  static cleanup(): void {
    eventBus.clear();
    console.log('🧹 [EventSubscription] 事件订阅清理完成');
  }
}

/**
 * 导出便捷的初始化函数
 */
export function initializeEventSubscriptions(): void {
  EventSubscriptionInitializer.initialize();
}

export function cleanupEventSubscriptions(): void {
  EventSubscriptionInitializer.cleanup();
}
