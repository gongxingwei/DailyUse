/**
 * 模块状态调试工具
 * 可以在渲染进程中查看和管理模块状态
 */

export interface ModuleStatusInfo {
  [moduleName: string]: boolean;
}

export class ModuleDebugger {
  /**
   * 获取所有模块的状态
   */
  static async getModuleStatus(): Promise<ModuleStatusInfo> {
    try {
      return await window.shared.ipcRenderer.invoke('get-module-status');
    } catch (error) {
      console.error('Failed to get module status:', error);
      return {};
    }
  }

  /**
   * 打印模块状态到控制台
   */
  static async printModuleStatus(): Promise<void> {
    const status = await this.getModuleStatus();

    console.table(status);

    const total = Object.keys(status).length;
    const initialized = Object.values(status).filter(Boolean).length;
    const failed = total - initialized;

    console.log(`📊 Summary: ${initialized}/${total} modules initialized`);
    if (failed > 0) {
      console.warn(`⚠️ ${failed} modules failed to initialize`);
    }
    console.groupEnd();
  }

  /**
   * 检查特定模块是否已初始化
   */
  static async isModuleReady(moduleName: string): Promise<boolean> {
    const status = await this.getModuleStatus();
    return status[moduleName] || false;
  }

  /**
   * 等待模块初始化完成
   */
  static async waitForModule(moduleName: string, timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.isModuleReady(moduleName)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.warn(`⏰ Timeout waiting for module: ${moduleName}`);
    return false;
  }

  /**
   * 等待所有模块初始化完成
   */
  static async waitForAllModules(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getModuleStatus();
      const allReady = Object.values(status).every(Boolean);

      if (allReady && Object.keys(status).length > 0) {
        console.log('✅ All modules are ready');
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.warn('⏰ Timeout waiting for all modules');
    await this.printModuleStatus();
    return false;
  }
}

// 开发环境下暴露到全局对象，方便调试
if (process.env.NODE_ENV === 'development') {
  (window as any).moduleDebugger = ModuleDebugger;
}

export default ModuleDebugger;
