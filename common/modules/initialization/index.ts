// 全局初始化服务导出
export {
  GlobalInitializationService,
  getGlobalInitializationService,
} from './GlobalInitializationService';

// 便于在 Vue 组件中使用的导出
export type { GlobalInitializationService as IGlobalInitializationService };

// 类型定义
export interface InitializationResult {
  success: boolean;
  results: {
    goals?: { goalsCount: number; goalDirsCount: number };
    tasks?: { templatesCount: number; instancesCount: number; metaTemplatesCount: number };
    repositories?: { repositoriesCount: number };
    editor?: { filesCount: number; editorGroupsCount: number; repositoriesCount: number };
  };
  errors: string[];
}

export interface SyncStatus {
  goal: boolean;
  task: boolean;
  repository: boolean;
  editor: boolean;
  overall: boolean;
}

export interface InitializationStatus {
  isInitialized: boolean;
  isInitializing: boolean;
}
