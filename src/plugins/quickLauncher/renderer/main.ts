import { PluginManager } from '@/plugins/core/PluginManager'
import quickLauncherPlugin from './renderer'

// 初始化插件系统
console.log('[QuickLauncher] 创建插件管理器')
const pluginManager = new PluginManager()

// 注册快速启动器插件
console.log('[QuickLauncher] 注册渲染进程插件')
pluginManager.register(quickLauncherPlugin)

// 初始化所有插件
console.log('[QuickLauncher] 初始化插件')
pluginManager.initializeAll()
