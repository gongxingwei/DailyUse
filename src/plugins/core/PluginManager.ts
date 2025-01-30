import { Plugin } from './types';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private initialized: boolean = false;

  constructor() {}

  async register(plugin: Plugin): Promise<void> {
    console.log(`[PluginManager] 1. 开始注册插件: ${plugin.metadata.name}`);
    
    if (this.plugins.has(plugin.metadata.name)) {
      console.error(`[PluginManager] 错误: 插件 ${plugin.metadata.name} 已经注册过了`);
      throw new Error(`Plugin ${plugin.metadata.name} is already registered`);
    }
    
    this.plugins.set(plugin.metadata.name, plugin);
    console.log(`[PluginManager] 2. 插件 ${plugin.metadata.name} 注册成功`);
    
    if (this.initialized) {
      console.log(`[PluginManager] 3. PluginManager已初始化，立即初始化新插件: ${plugin.metadata.name}`);
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
    console.log('[PluginManager] 开始初始化所有插件...');
    this.initialized = true;
    
    for (const [name, plugin] of this.plugins) {
      console.log(`[PluginManager] 正在初始化插件: ${name}`);
      try {
        await plugin.init();
        console.log(`[PluginManager] 插件 ${name} 初始化成功`);
      } catch (error) {
        console.error(`[PluginManager] 插件 ${name} 初始化失败:`, error);
      }
    }
    
    console.log('[PluginManager] 所有插件初始化完成');
  }

  async destroyAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.destroy();
    }
    this.plugins.clear();
    this.initialized = false;
  }

  getPlugin(name: string): Plugin | undefined {
    console.log(`[PluginManager] 获取插件: ${name}`);
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}
