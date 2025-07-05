/**
 * 模块注册系统
 * 统一管理所有 Electron 主进程模块的初始化和清理
 */

export interface Module {
  name: string;
  initialize: () => void | Promise<void>;
  cleanup?: () => void | Promise<void>;
  dependencies?: string[];
  priority?: number; // 数字越小优先级越高
}

export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules = new Map<string, Module>();
  private initializedModules = new Set<string>();
  private isShuttingDown = false;

  static getInstance(): ModuleRegistry {
    if (!this.instance) {
      this.instance = new ModuleRegistry();
    }
    return this.instance;
  }

  /**
   * 注册模块
   */
  register(module: Module): void {
    if (this.modules.has(module.name)) {
      console.warn(`Module ${module.name} is already registered, replacing...`);
    }
    
    this.modules.set(module.name, {
      priority: 100, // 默认优先级
      ...module
    });
    
    console.log(`📦 Module ${module.name} registered`);
  }

  /**
   * 批量注册模块
   */
  registerAll(modules: Module[]): void {
    modules.forEach(module => this.register(module));
  }

  /**
   * 初始化所有模块
   */
  async initializeAll(): Promise<void> {
    if (this.isShuttingDown) {
      console.warn('Cannot initialize modules during shutdown');
      return;
    }

    console.log('🚀 Starting module initialization...');
    
    // 按依赖关系和优先级排序
    const sortedModules = this.resolveDependencies();
    
    for (const module of sortedModules) {
      await this.initializeModule(module);
    }
    
    console.log(`✅ All ${this.initializedModules.size} modules initialized successfully`);
  }

  /**
   * 初始化单个模块
   */
  async initializeModule(module: Module): Promise<void> {
    if (this.initializedModules.has(module.name)) {
      console.log(`⏭️ Module ${module.name} already initialized, skipping...`);
      return;
    }

    // 检查依赖是否已初始化
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (!this.initializedModules.has(dep)) {
          const depModule = this.modules.get(dep);
          if (depModule) {
            await this.initializeModule(depModule);
          } else {
            throw new Error(`Dependency ${dep} for module ${module.name} is not registered`);
          }
        }
      }
    }

    try {
      console.log(`🔧 Initializing module: ${module.name}...`);
      await module.initialize();
      this.initializedModules.add(module.name);
      console.log(`✓ Module ${module.name} initialized`);
    } catch (error) {
      console.error(`✗ Failed to initialize module ${module.name}:`, error);
      throw error;
    }
  }

  /**
   * 清理所有模块
   */
  async cleanupAll(): Promise<void> {
    this.isShuttingDown = true;
    console.log('🧹 Starting module cleanup...');
    
    // 按初始化的反向顺序清理
    const modulesToCleanup = Array.from(this.initializedModules)
      .map(name => this.modules.get(name))
      .filter((module): module is Module => !!module)
      .reverse();

    for (const module of modulesToCleanup) {
      await this.cleanupModule(module);
    }
    
    this.initializedModules.clear();
    console.log('✅ All modules cleaned up');
  }

  /**
   * 清理单个模块
   */
  async cleanupModule(module: Module): Promise<void> {
    if (!this.initializedModules.has(module.name)) {
      return;
    }

    try {
      if (module.cleanup) {
        console.log(`🧹 Cleaning up module: ${module.name}...`);
        await module.cleanup();
        console.log(`✓ Module ${module.name} cleaned up`);
      }
      this.initializedModules.delete(module.name);
    } catch (error) {
      console.error(`✗ Failed to cleanup module ${module.name}:`, error);
    }
  }

  /**
   * 解析依赖关系并排序
   */
  private resolveDependencies(): Module[] {
    const modules = Array.from(this.modules.values());
    const sorted: Module[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (module: Module) => {
      if (visiting.has(module.name)) {
        throw new Error(`Circular dependency detected involving ${module.name}`);
      }
      
      if (visited.has(module.name)) {
        return;
      }

      visiting.add(module.name);

      // 先处理依赖
      if (module.dependencies) {
        for (const depName of module.dependencies) {
          const depModule = this.modules.get(depName);
          if (depModule) {
            visit(depModule);
          }
        }
      }

      visiting.delete(module.name);
      visited.add(module.name);
      sorted.push(module);
    };

    // 按优先级排序后进行拓扑排序
    modules
      .sort((a, b) => (a.priority || 100) - (b.priority || 100))
      .forEach(visit);

    return sorted;
  }

  /**
   * 获取模块状态
   */
  getModuleStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    for (const [name] of this.modules) {
      status[name] = this.initializedModules.has(name);
    }
    return status;
  }

  /**
   * 检查模块是否已初始化
   */
  isModuleInitialized(name: string): boolean {
    return this.initializedModules.has(name);
  }
}

// 导出单例实例
export const moduleRegistry = ModuleRegistry.getInstance();
