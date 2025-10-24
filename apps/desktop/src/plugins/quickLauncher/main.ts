import { PluginManager } from '@/plugins/core/PluginManager';
import quickLauncherPlugin from './renderer';

// 初始化插件系统

const pluginManager = new PluginManager();

// 注册快速启动器插件

pluginManager.register(quickLauncherPlugin);

// 初始化所有插件

pluginManager.initializeAll();
