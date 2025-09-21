/**
 * Domain Client Module for Editor
 * 编辑器领域客户端模块入口
 */

// Services
import {
  DocumentManagementService,
  WorkspaceManagementService,
  SearchService,
} from './services/DomainServices';

// UI Adapters
import { MonacoEditorAdapter } from './ui-adapters/MonacoEditorAdapter';
import { DocumentListAdapter, TabAdapter, ToolbarAdapter } from './ui-adapters/ComponentAdapters';

// 重新导出
export { MonacoEditorAdapter };
export { DocumentListAdapter, TabAdapter, ToolbarAdapter };
export { DocumentManagementService, WorkspaceManagementService, SearchService };

// Store (使用简化版Store，不依赖Pinia)
export { useDocumentStore, useWorkspaceStore, useUIStore } from './stores/SimpleEditorStore';

/**
 * 编辑器客户端门面类
 * 提供统一的客户端接口
 */
export class EditorClientFacade {
  private documentService: DocumentManagementService;
  private workspaceService: WorkspaceManagementService;
  private searchService: SearchService;
  private monacoAdapter: MonacoEditorAdapter | null;
  private documentListAdapter: DocumentListAdapter;
  private tabAdapter: TabAdapter;
  private toolbarAdapter: ToolbarAdapter;

  constructor() {
    // 初始化服务
    this.documentService = new DocumentManagementService();
    this.workspaceService = new WorkspaceManagementService();
    this.searchService = new SearchService();

    // 初始化适配器 (MonacoEditorAdapter 需要在 Vue 组件中创建)
    this.monacoAdapter = null as any; // 稍后在 Vue 组件中设置
    this.documentListAdapter = new DocumentListAdapter();
    this.tabAdapter = new TabAdapter();
    this.toolbarAdapter = new ToolbarAdapter();

    // 设置事件监听
    this.setupEventListeners();
  }

  /**
   * 获取文档管理服务
   */
  getDocumentService(): DocumentManagementService {
    return this.documentService;
  }

  /**
   * 获取工作空间管理服务
   */
  getWorkspaceService(): WorkspaceManagementService {
    return this.workspaceService;
  }

  /**
   * 获取搜索服务
   */
  getSearchService(): SearchService {
    return this.searchService;
  }

  /**
   * 获取 Monaco 编辑器适配器
   */
  getMonacoAdapter(): MonacoEditorAdapter | null {
    return this.monacoAdapter;
  }

  /**
   * 设置 Monaco 编辑器适配器
   */
  setMonacoAdapter(adapter: MonacoEditorAdapter): void {
    this.monacoAdapter = adapter;
  }

  /**
   * 获取文档列表适配器
   */
  getDocumentListAdapter(): DocumentListAdapter {
    return this.documentListAdapter;
  }

  /**
   * 获取标签页适配器
   */
  getTabAdapter(): TabAdapter {
    return this.tabAdapter;
  }

  /**
   * 获取工具栏适配器
   */
  getToolbarAdapter(): ToolbarAdapter {
    return this.toolbarAdapter;
  }

  /**
   * 初始化编辑器客户端
   */
  async initialize(): Promise<void> {
    console.log('Initializing Editor Client...');

    try {
      // 初始化 Monaco 编辑器 (如果已设置)
      if (this.monacoAdapter) {
        // Monaco 编辑器适配器不需要异步初始化
        console.log('Monaco Editor Adapter is ready');
      }

      // 加载初始数据
      await this.loadInitialData();

      console.log('Editor Client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Editor Client:', error);
      throw error;
    }
  }

  /**
   * 销毁编辑器客户端
   */
  destroy(): void {
    console.log('Destroying Editor Client...');

    try {
      // 销毁适配器
      if (this.monacoAdapter) {
        // Monaco 编辑器适配器不需要显式销毁
        this.monacoAdapter = null;
      }

      console.log('Editor Client destroyed successfully');
    } catch (error) {
      console.error('Error during Editor Client destruction:', error);
    }
  }

  private setupEventListeners(): void {
    // 文档变更事件
    this.documentService.on('documentAdded', (data) => {
      this.documentListAdapter.setDocuments(this.documentService.getAllDocuments());
    });

    this.documentService.on('documentRemoved', (data) => {
      this.documentListAdapter.setDocuments(this.documentService.getAllDocuments());
      // 如果移除的文档有对应的标签页，也要移除
      // this.tabAdapter.removeTabByDocumentUuid(data.documentUuid);
    });

    this.documentService.on('activeDocumentChanged', (data) => {
      const document = this.documentService.getActiveDocument();
      this.toolbarAdapter.setCurrentDocument(document);

      if (data.currentUuid) {
        this.tabAdapter.setActiveTab(data.currentUuid);
      }
    });

    // 工作空间变更事件
    this.workspaceService.on('activeWorkspaceChanged', (data) => {
      const workspace = this.workspaceService.getActiveWorkspace();
      console.log('Active workspace changed:', workspace?.name);
    });

    // 搜索事件
    this.searchService.on('searchCompleted', (data) => {
      this.documentListAdapter.setSearchResults(data.results);
    });
  }

  private async loadInitialData(): Promise<void> {
    // 加载初始文档列表
    const documents = this.documentService.getAllDocuments();
    this.documentListAdapter.setDocuments(documents);

    // 设置初始工具栏状态
    const activeDocument = this.documentService.getActiveDocument();
    this.toolbarAdapter.setCurrentDocument(activeDocument);
  }
}

/**
 * 创建编辑器客户端实例
 */
export function createEditorClient(): EditorClientFacade {
  return new EditorClientFacade();
}

/**
 * 默认导出
 */
export default EditorClientFacade;
