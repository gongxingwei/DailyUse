/**
 * 主进程插件管理器
 * 负责管理所有主进程插件的生命周期
 */

export interface IMainPlugin {
  name: string;
  initialize(): Promise<void>;
  cleanup(): void;
}

export class MainPluginManager {
  private plugins: Map<string, IMainPlugin> = new Map();
  private static instance: MainPluginManager;

  static getInstance(): MainPluginManager {
    if (!MainPluginManager.instance) {
      MainPluginManager.instance = new MainPluginManager();
    }
    return MainPluginManager.instance;
  }

  register(plugin: IMainPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  async initializeAll(): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      try {
        await plugin.initialize();
        console.log(`✅ [PluginManager] 主进程插件初始化成功: ${name}`);
      } catch (error) {
        console.error(`❌ [PluginManager] 主进程插件初始化失败: ${name}`, error);
      }
    }
  }

  cleanupAll(): void {
    for (const [name, plugin] of this.plugins) {
      try {
        plugin.cleanup();
        console.log(`✅ [PluginManager] 主进程插件清理成功: ${name}`);
      } catch (error) {
        console.error(`❌ [PluginManager] 主进程插件清理失败: ${name}`, error);
      }
    }
  }
}
