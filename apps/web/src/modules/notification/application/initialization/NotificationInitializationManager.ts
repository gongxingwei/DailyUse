/**
 * Notification 模块初始化管理器
 * @description 负责初始化notification模块的所有服务和事件监听器
 */

import { NotificationService } from '../services/NotificationService';
import { NotificationEventHandlers } from '../events/NotificationEventHandlers';
import { NotificationConfigStorage } from '../../infrastructure/storage/NotificationConfigStorage';
import { sseClient } from '../../infrastructure/sse/SSEClient';

import type { NotificationServiceConfig } from '../../domain/types';

/**
 * Notification 模块初始化管理器
 */
export class NotificationInitializationManager {
  private static instance: NotificationInitializationManager;
  private notificationService: NotificationService | null = null;
  private eventHandlers: NotificationEventHandlers | null = null;
  private isInitialized = false;
  private sseConnected = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): NotificationInitializationManager {
    if (!NotificationInitializationManager.instance) {
      NotificationInitializationManager.instance = new NotificationInitializationManager();
    }
    return NotificationInitializationManager.instance;
  }

  /**
   * 初始化Notification模块
   */
  async initializeNotificationModule(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[NotificationInit] Notification模块已初始化');
      return;
    }

    console.log('[NotificationInit] 开始初始化Notification模块...');

    // 使用更宽松的初始化策略，部分功能失败不应该阻塞整个应用
    const initializationSteps = [
      { name: '通知服务', fn: () => this.initializeNotificationService() },
      { name: '事件处理器', fn: () => this.initializeEventHandlers() },
      { name: '全局错误处理', fn: () => this.setupGlobalErrorHandling() },
    ];

    const nonCriticalSteps = [
      { name: '通知权限', fn: () => this.requestNotificationPermissions() },
      { name: 'SSE 连接', fn: () => this.initializeSSEConnection() },
    ];

    try {
      // 执行关键初始化步骤
      for (const step of initializationSteps) {
        try {
          await step.fn();
          console.log(`[NotificationInit] ✅ ${step.name}初始化完成`);
        } catch (error) {
          console.error(`[NotificationInit] ❌ ${step.name}初始化失败:`, error);
          throw error; // 关键步骤失败则抛出错误
        }
      }

      // 执行非关键初始化步骤（失败不阻塞）
      for (const step of nonCriticalSteps) {
        try {
          await step.fn();
          console.log(`[NotificationInit] ✅ ${step.name}初始化完成`);
        } catch (error) {
          console.warn(`[NotificationInit] ⚠️ ${step.name}初始化失败（非关键）:`, error);
          // 继续执行，不抛出错误
        }
      }

      this.isInitialized = true;
      console.log('[NotificationInit] ✅ Notification模块初始化完成');
    } catch (error) {
      console.error('[NotificationInit] ❌ Notification模块关键组件初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化通知服务
   */
  private async initializeNotificationService(): Promise<void> {
    console.log('[NotificationInit] 初始化通知服务...');

    // 获取服务实例
    this.notificationService = NotificationService.getInstance();

    // 加载保存的配置
    const savedConfig = NotificationConfigStorage.loadConfig();
    if (savedConfig) {
      console.log('[NotificationInit] 应用保存的配置');
      this.notificationService.updateConfig(savedConfig);
    }

    console.log('[NotificationInit] ✅ 通知服务初始化完成');
  }

  /**
   * 初始化事件处理器
   */
  private async initializeEventHandlers(): Promise<void> {
    console.log('[NotificationInit] 初始化事件处理器...');

    this.eventHandlers = new NotificationEventHandlers();
    this.eventHandlers.initializeEventHandlers();

    console.log('[NotificationInit] ✅ 事件处理器初始化完成');
  }

  /**
   * 请求通知权限
   */
  private async requestNotificationPermissions(): Promise<void> {
    if (!this.notificationService) return;

    console.log('[NotificationInit] 检查通知权限...');

    try {
      const currentPermission = this.notificationService.getPermission();

      if (currentPermission === 'default') {
        console.log('[NotificationInit] 请求通知权限...');
        const permission = await this.notificationService.requestPermission();

        if (permission === 'granted') {
          console.log('[NotificationInit] ✅ 通知权限已授予');
        } else {
          console.warn('[NotificationInit] ⚠️ 通知权限被拒绝');
        }
      } else {
        console.log(`[NotificationInit] 通知权限状态: ${currentPermission}`);
      }
    } catch (error) {
      console.error('[NotificationInit] 请求通知权限失败:', error);
    }
  }

  /**
   * 初始化 SSE 连接
   */
  private async initializeSSEConnection(): Promise<void> {
    console.log('[NotificationInit] 初始化 SSE 连接...');

    // 使用非阻塞方式连接，避免阻塞应用启动
    try {
      // 设置连接超时，避免无限等待
      const connectPromise = sseClient.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SSE 连接超时')), 5000); // 5秒超时
      });

      await Promise.race([connectPromise, timeoutPromise]);
      this.sseConnected = true;
      console.log('[NotificationInit] ✅ SSE 连接建立成功');
    } catch (error) {
      console.warn('[NotificationInit] ⚠️ SSE 连接失败，将使用本地事件:', error);
      this.sseConnected = false;
      // SSE 连接失败不应该阻止通知模块初始化

      // 在后台重试连接
      this.retrySSEConnectionInBackground();
    }
  }

  /**
   * 在后台重试 SSE 连接
   */
  private retrySSEConnectionInBackground(): void {
    console.log('[NotificationInit] 将在后台重试 SSE 连接...');

    setTimeout(async () => {
      if (!this.sseConnected) {
        try {
          await sseClient.connect();
          this.sseConnected = true;
          console.log('[NotificationInit] ✅ SSE 后台重连成功');
        } catch (error) {
          console.warn('[NotificationInit] SSE 后台重连失败:', error);
          // 可以设置更长时间的重试
        }
      }
    }, 10000); // 10秒后重试
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandling(): void {
    console.log('[NotificationInit] 设置全局错误处理...');

    // 监听未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.toString().includes('notification')) {
        console.error('[NotificationInit] 未处理的通知相关Promise拒绝:', event.reason);
        event.preventDefault();
      }
    });

    // 监听全局错误
    window.addEventListener('error', (event) => {
      if (event.message?.includes('notification') || event.filename?.includes('notification')) {
        console.error('[NotificationInit] 通知相关全局错误:', event.error);
      }
    });

    console.log('[NotificationInit] ✅ 全局错误处理设置完成');
  }

  /**
   * 获取通知服务实例
   */
  getNotificationService(): NotificationService | null {
    return this.notificationService;
  }

  /**
   * 获取事件处理器实例
   */
  getEventHandlers(): NotificationEventHandlers | null {
    return this.eventHandlers;
  }

  /**
   * 检查模块是否已初始化
   */
  isModuleInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 更新通知配置并保存
   */
  updateNotificationConfig(config: Partial<NotificationServiceConfig>): void {
    if (!this.notificationService) {
      console.error('[NotificationInit] 通知服务未初始化');
      return;
    }

    // 更新服务配置
    this.notificationService.updateConfig(config);

    // 保存到存储
    const fullConfig = this.notificationService.getConfig();
    NotificationConfigStorage.saveConfig(fullConfig);

    console.log('[NotificationInit] 通知配置已更新并保存');
  }

  /**
   * 重置通知配置为默认值
   */
  resetNotificationConfig(): void {
    if (!this.notificationService) {
      console.error('[NotificationInit] 通知服务未初始化');
      return;
    }

    // 清除保存的配置
    NotificationConfigStorage.clearConfig();

    // 重新初始化服务（使用默认配置）
    const defaultConfig = {
      maxConcurrentNotifications: 3,
      defaultAutoClose: 5000,
      enablePersistence: true,
      soundEnabled: true,
      vibrationEnabled: false,
      desktopEnabled: true,
      globalVolume: 0.7,
      doNotDisturbEnabled: false,
    };

    this.notificationService.updateConfig(defaultConfig);

    console.log('[NotificationInit] 通知配置已重置为默认值');
  }

  /**
   * 测试通知功能
   */
  async testNotificationFeatures(): Promise<{
    desktopSupport: boolean;
    audioSupport: boolean;
    permissionGranted: boolean;
    configPersistence: boolean;
  }> {
    const result = {
      desktopSupport: false,
      audioSupport: false,
      permissionGranted: false,
      configPersistence: false,
    };

    try {
      if (!this.notificationService) {
        console.error('[NotificationInit] 通知服务未初始化');
        return result;
      }

      // 测试桌面通知支持
      result.desktopSupport = 'Notification' in window;

      // 测试音频支持
      result.audioSupport = 'Audio' in window;

      // 测试权限状态
      result.permissionGranted = this.notificationService.getPermission() === 'granted';

      // 测试配置持久化
      result.configPersistence = NotificationConfigStorage.isStorageAvailable();

      // 发送测试通知
      if (result.permissionGranted) {
        await this.notificationService.showInfo('通知功能测试', {
          autoClose: 3000,
        });
      }

      console.log('[NotificationInit] 通知功能测试结果:', result);
      return result;
    } catch (error) {
      console.error('[NotificationInit] 通知功能测试失败:', error);
      return result;
    }
  }

  /**
   * 销毁Notification模块
   */
  destroy(): void {
    if (!this.isInitialized) return;

    console.log('[NotificationInit] 销毁Notification模块...');

    try {
      // 销毁事件处理器
      if (this.eventHandlers) {
        this.eventHandlers.destroy();
        this.eventHandlers = null;
      }

      // 销毁通知服务
      if (this.notificationService) {
        this.notificationService.destroy();
        this.notificationService = null;
      }

      // 断开 SSE 连接
      if (this.sseConnected) {
        sseClient.destroy();
        this.sseConnected = false;
      }

      this.isInitialized = false;
      console.log('[NotificationInit] ✅ Notification模块已销毁');
    } catch (error) {
      console.error('[NotificationInit] ❌ 销毁Notification模块失败:', error);
    }
  }

  /**
   * 重新初始化模块
   */
  async reinitialize(): Promise<void> {
    console.log('[NotificationInit] 重新初始化Notification模块...');

    this.destroy();
    await this.initializeNotificationModule();

    console.log('[NotificationInit] ✅ Notification模块重新初始化完成');
  }
}
