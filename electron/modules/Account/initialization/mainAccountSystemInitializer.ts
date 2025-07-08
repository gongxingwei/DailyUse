import { MainAccountApplicationService } from "../application/services/mainAccountApplicationService";
import { SqliteAccountRepository } from "../infrastructure/repositories/sqliteAccountRepository";
import { IAccountRepository } from "../domain/repositories/accountRepository";

/**
 * 主进程中的账号系统初始化器
 * 负责在主进程中设置依赖注入和系统初始化
 * 
 * 注意：认证和会话管理功能已迁移到 Authentication 和 SessionLogging 模块
 * Account 模块现在只负责身份信息管理
 */
export class MainAccountSystemInitializer {
  private static initialized = false;
  private static accountAppService: MainAccountApplicationService;

  /**
   * 初始化账号系统
   * 创建所有必要的服务实例并设置依赖关系
   */
  static initialize(): MainAccountApplicationService {
    if (this.initialized) {
      return this.accountAppService;
    }

    try {
      console.log('🔄 [主进程-初始化] 开始初始化账号系统');

      // 1. 创建账号存储库实例（明确类型注解以避免路径冲突）
      const accountRepository: IAccountRepository = new SqliteAccountRepository();

      console.log('✅ [主进程-初始化] 账号存储库实例创建完成');

      // 2. 创建账号应用服务（只负责身份信息管理）
      this.accountAppService = MainAccountApplicationService.getInstance(
        accountRepository
      );

      console.log('✅ [主进程-初始化] 账号应用服务创建完成');

      this.initialized = true;

      console.log('🎉 [主进程-初始化] 账号系统初始化完成');
      console.log('💡 [主进程-初始化] 认证功能请使用 Authentication 模块');

      return this.accountAppService;

    } catch (error) {
      console.error('❌ [主进程-初始化] 账号系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取应用服务实例
   */
  static getAccountApplicationService(): MainAccountApplicationService {
    if (!this.initialized) {
      throw new Error('账号系统尚未初始化，请先调用 initialize() 方法');
    }
    return this.accountAppService;
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 重置初始化状态（主要用于测试）
   */
  static reset(): void {
    this.initialized = false;
    this.accountAppService = null as any;
    console.log('🔄 [主进程-初始化] 账号系统状态已重置');
  }
}
