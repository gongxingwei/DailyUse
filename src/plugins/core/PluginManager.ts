import { Plugin } from './types';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private initialized: boolean = false;

  constructor() {}

  async register(plugin: Plugin): Promise<void> {
    
    if (this.plugins.has(plugin.metadata.name)) {
      console.error(`[PluginManager] 错误: 插件 ${plugin.metadata.name} 已经注册过了`);
      throw new Error(`Plugin ${plugin.metadata.name} is already registered`);
    }
    
    this.plugins.set(plugin.metadata.name, plugin);

    if (this.initialized) {
      await plugin.init();
    }
  }

  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      await plugin.destroy();
      this.plugins.delete(pluginName);
    }
  }

  async initializeAll(): Promise<void> {
    this.initialized = true;
    
    for (const [name, plugin] of this.plugins) {

      try {
        await plugin.init();
      } catch (error) {
        console.error(`[PluginManager] 插件 ${name} 初始化失败:`, error);
      }
    }
    
  }

  async destroyAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.destroy();
    }
    this.plugins.clear();
    this.initialized = false;
  }

  getPlugin(name: string): Plugin | undefined {

    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}
