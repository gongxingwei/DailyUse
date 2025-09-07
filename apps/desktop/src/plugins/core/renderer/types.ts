export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
}

export interface Plugin {
  metadata: PluginMetadata;
  init(): Promise<void>;
  destroy(): Promise<void>;
}

export interface ElectronPlugin extends Plugin {
  // 主进程特有的方法
  registerIpcHandlers?(): void;
  registerShortcuts?(): void;
}

export interface RendererPlugin extends Plugin {
  // 渲染进程特有的方法
  registerComponents?(): void;
  registerRoutes?(): void;
}
