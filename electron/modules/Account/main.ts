import { NewAccountIpcHandler } from "./ipcs/newAccountIpcHandler";
import { MainAccountSystemInitializer } from "./initialization/mainAccountSystemInitializer";

/**
 * 主进程 Account 模块入口
 * 负责初始化账号系统并注册 IPC 处理器
 */
export class MainAccountModule {
  private static initialized = false;

  /**
   * 初始化账号模块
   * 在主进程启动时调用
   */
  public static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⏭️ [主进程-Account] 模块已初始化，跳过');
      return;
    }

    try {
      console.log('🔄 [主进程-Account] 开始初始化模块');

      // 1. 初始化账号系统
      MainAccountSystemInitializer.initialize();
      console.log('✅ [主进程-Account] 账号系统初始化完成');

      // 2. 注册 IPC 处理器
      NewAccountIpcHandler.register();
      console.log('✅ [主进程-Account] IPC 处理器注册完成');

      this.initialized = true;
      console.log('🎉 [主进程-Account] 模块初始化完成');

    } catch (error) {
      console.error('❌ [主进程-Account] 模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 清理账号模块
   * 在主进程退出时调用
   */
  public static cleanup(): void {
    try {
      console.log('🔄 [主进程-Account] 开始清理模块');

      // 注销 IPC 处理器
      NewAccountIpcHandler.unregister();
      console.log('✅ [主进程-Account] IPC 处理器注销完成');

      // 重置初始化状态
      MainAccountSystemInitializer.reset();
      this.initialized = false;
      
      console.log('🎉 [主进程-Account] 模块清理完成');

    } catch (error) {
      console.error('❌ [主进程-Account] 模块清理失败:', error);
    }
  }

  /**
   * 检查是否已初始化
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }
}

// 兼容旧接口
export async function initializeAccountModule(): Promise<void> {
  console.log('🔄 [主进程-Account] 使用兼容接口初始化模块');
  await MainAccountModule.initialize();
}

export function cleanupAccountModule(): void {
  console.log('🔄 [主进程-Account] 使用兼容接口清理模块');
  MainAccountModule.cleanup();
}
