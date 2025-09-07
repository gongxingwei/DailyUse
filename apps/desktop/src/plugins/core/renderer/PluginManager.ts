/**
 * 渲染进程插件管理器
 * 负责管理所有渲染进程插件的生命周期
 */

export interface IRendererPlugin {
  name: string;
  initialize(): Promise<void>;
  cleanup(): void;
}

export class RendererPluginManager {
  private plugins: Map<string, IRendererPlugin> = new Map();
  private static instance: RendererPluginManager;

  static getInstance(): RendererPluginManager {
    if (!RendererPluginManager.instance) {
      RendererPluginManager.instance = new RendererPluginManager();
    }
    return RendererPluginManager.instance;
  }

  register(plugin: IRendererPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  async initializeAll(): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      try {
        await plugin.initialize();
        console.log(`✅ [RendererPluginManager] 渲染进程插件初始化成功: ${name}`);
      } catch (error) {
        console.error(`❌ [RendererPluginManager] 渲染进程插件初始化失败: ${name}`, error);
      }
    }
  }

  cleanupAll(): void {
    for (const [name, plugin] of this.plugins) {
      try {
        plugin.cleanup();
        console.log(`✅ [RendererPluginManager] 渲染进程插件清理成功: ${name}`);
      } catch (error) {
        console.error(`❌ [RendererPluginManager] 渲染进程插件清理失败: ${name}`, error);
      }
    }
  }
}
