// src/shared/services/appInitService.ts
// import { useThemeInit } from '@/modules/Theme/useThemeInit';
// import { initializeLanguage } from '@/i18n/index';
import { ReminderInitService } from '@/modules/Reminder/services/reminderInitService';
import { UserDataInitService } from '@/shared/services/userDataInitService';
import { taskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';

export interface InitializationOptions {
  autoInit?: boolean;
  skipDataInit?: boolean;
  skipTheme?: boolean;
  skipLanguage?: boolean;
  skipReminders?: boolean;
}

export class AppInitService {
  private static isInitialized = false;
  private static cleanupFunctions: Array<() => void> = [];

  /**
   * 初始化整个应用
   */
  static async initialize(options: InitializationOptions = {}): Promise<void> {
    if (this.isInitialized) {
      console.warn('应用已经初始化');
      return;
    }

    try {
      console.log('开始应用初始化...');

      // 1. 基础初始化（同步，必须的）
      await this.initBasicServices(options);

      // 2. 数据初始化（异步，依赖用户登录状态）
      if (!options.skipDataInit) {
        await this.initDataServices(options);
      }

      // 3. 功能模块初始化（异步，依赖数据）
      if (!options.skipReminders) {
        await this.initFunctionalServices(options);
      }

      this.isInitialized = true;
      console.log('应用初始化完成');
    } catch (error) {
      console.error('应用初始化失败:', error);
      throw error;
    }
  }

  /**
   * 基础服务初始化（主题、语言等）
   */
  private static async initBasicServices(_options: InitializationOptions): Promise<void> {
    console.log('初始化基础服务...');

    // // 主题初始化
    // if (!options.skipTheme) {
    //   useThemeInit();
    //   console.log('✓ 主题初始化完成');
    // }

    // // 语言初始化
    // if (!options.skipLanguage) {
    //   await initializeLanguage();
    //   console.log('✓ 语言初始化完成');
    // }
  }

  /**
   * 数据服务初始化（用户数据等）
   */
  private static async initDataServices(_options: InitializationOptions): Promise<void> {
    console.log('初始化数据服务...');

    try {
      await UserDataInitService.initUserData();
      console.log('✓ 用户数据初始化完成');
    } catch (error) {
      console.warn('用户数据初始化失败，可能是因为用户未登录:', error);
      // 不抛出错误，允许应用继续运行
    }
  }

  /**
   * 功能服务初始化（提醒系统等）
   */
  private static async initFunctionalServices(_options: InitializationOptions): Promise<void> {
    console.log('初始化功能服务...');

    await Promise.all([
      ReminderInitService.initialize(),
      taskDomainApplicationService.initializeTaskReminders()
    ]);

    console.log('✓ 功能服务初始化完成');
  }

  /**
   * 重新初始化（用于用户登录后）
   */
  static async reinitialize(options: InitializationOptions = {}): Promise<void> {
    console.log('重新初始化应用...');

    // 清理现有状态
    this.cleanup();

    // 重新初始化
    this.isInitialized = false;
    await this.initialize(options);
  }

  /**
   * 仅重新初始化数据相关服务
   */
  static async reinitializeUserData(): Promise<void> {
    console.log('重新初始化用户数据...');

    try {
      // 重新加载用户数据
      await UserDataInitService.initUserData();

     

      console.log('用户数据重新初始化完成');
    } catch (error) {
      console.error('用户数据重新初始化失败:', error);
      throw error;
    }
  }

  /**
   * 添加清理函数
   */
  static addCleanupFunction(cleanup: () => void): void {
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * 清理所有资源
   */
  static cleanup(): void {
    console.log('清理应用资源...');

    ReminderInitService.destroy();
    // 任务提醒通过主进程管理，无需在渲染进程清理

    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('清理函数执行失败:', error);
      }
    });

    this.cleanupFunctions = [];
    this.isInitialized = false;
    console.log('应用资源清理完成');
  }

  /**
   * 检查初始化状态
   */
  static getInitializationStatus(): {
    isInitialized: boolean;
    timestamp: Date;
  } {
    return {
      isInitialized: this.isInitialized,
      timestamp: new Date()
    };
  }
}