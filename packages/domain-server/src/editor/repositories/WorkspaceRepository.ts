/**
 * Workspace Repository Implementation
 * 工作空间仓储实现
 */

// 临时类型定义
interface EditorWorkspace {
  uuid: string;
  name: string;
  repositoryUuid: string;
  description?: string;
  currentDocumentUuid?: string;
  openDocuments: OpenDocument[];
  settings: EditorSettings;
  layout: WorkspaceLayout;
  createdAt: Date;
  lastActiveAt: Date;
  isArchived: boolean;
  metadata: WorkspaceMetadata;
}

interface OpenDocument {
  documentUuid: string;
  tabTitle: string;
  isDirty: boolean;
  lastActiveAt: number;
  cursorPosition: Position;
  scrollPosition: ScrollPosition;
  viewState?: any;
}

interface Position {
  line: number;
  column: number;
  offset: number;
}

interface ScrollPosition {
  x: number;
  y: number;
}

interface EditorSettings {
  theme: EditorTheme;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: AutoSaveSettings;
  syntax: SyntaxSettings;
}

interface EditorTheme {
  name: string;
  mode: 'light' | 'dark' | 'auto';
  customColors?: Record<string, string>;
}

interface AutoSaveSettings {
  enabled: boolean;
  delay: number;
  onFocusChange: boolean;
  onWindowChange: boolean;
}

interface SyntaxSettings {
  highlighting: boolean;
  validation: boolean;
  autocompletion: boolean;
  formatOnSave: boolean;
  customRules?: Record<string, any>;
}

interface WorkspaceLayout {
  sidebarWidth: number;
  editorWidth: number;
  previewWidth: number;
  isPreviewVisible: boolean;
  panelSizes: PanelSizes;
  viewMode: ViewMode;
  splitDirection: 'horizontal' | 'vertical';
}

interface PanelSizes {
  explorer: number;
  search: number;
  extensions: number;
  terminal: number;
}

interface ViewMode {
  mode: 'edit' | 'preview' | 'split';
  previewSync: boolean;
  previewPosition: 'right' | 'bottom' | 'popup';
}

interface WorkspaceMetadata {
  documentCount: number;
  totalSize: number;
  lastBackup?: Date;
  tags: string[];
  customProperties: Record<string, any>;
}

/**
 * 工作空间仓储实现
 */
export class WorkspaceRepository {
  private workspaces = new Map<string, EditorWorkspace>();
  private userWorkspaces = new Map<string, Set<string>>(); // userId -> workspace uuids

  constructor() {
    this.initializeDefaultWorkspaces();
  }

  /**
   * 创建工作空间
   */
  async create(workspace: EditorWorkspace): Promise<EditorWorkspace> {
    // 生成唯一ID
    if (!workspace.uuid) {
      workspace.uuid = this.generateUuid();
    }

    // 设置创建时间
    const now = new Date();
    workspace.createdAt = now;
    workspace.lastActiveAt = now;
    workspace.isArchived = false;

    // 初始化元数据
    if (!workspace.metadata) {
      workspace.metadata = {
        documentCount: 0,
        totalSize: 0,
        tags: [],
        customProperties: {},
      };
    }

    // 保存工作空间
    this.workspaces.set(workspace.uuid, workspace);

    return { ...workspace };
  }

  /**
   * 通过UUID获取工作空间
   */
  async findByUuid(uuid: string): Promise<EditorWorkspace | null> {
    const workspace = this.workspaces.get(uuid);
    return workspace ? { ...workspace } : null;
  }

  /**
   * 通过仓储UUID获取工作空间列表
   */
  async findByRepositoryUuid(repositoryUuid: string): Promise<EditorWorkspace[]> {
    const workspaces = Array.from(this.workspaces.values()).filter(
      (ws) => ws.repositoryUuid === repositoryUuid && !ws.isArchived,
    );

    return workspaces.map((ws) => ({ ...ws }));
  }

  /**
   * 获取用户的工作空间
   */
  async findByUserId(userId: string): Promise<EditorWorkspace[]> {
    const userWorkspaceUuids = this.userWorkspaces.get(userId) || new Set();
    const workspaces: EditorWorkspace[] = [];

    for (const uuid of userWorkspaceUuids) {
      const workspace = this.workspaces.get(uuid);
      if (workspace && !workspace.isArchived) {
        workspaces.push({ ...workspace });
      }
    }

    // 按最后活跃时间排序
    workspaces.sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());

    return workspaces;
  }

  /**
   * 更新工作空间
   */
  async update(uuid: string, updates: Partial<EditorWorkspace>): Promise<EditorWorkspace | null> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return null;

    // 更新字段
    const updatedWorkspace: EditorWorkspace = {
      ...workspace,
      ...updates,
      uuid, // 确保UUID不被覆盖
      lastActiveAt: new Date(),
    };

    // 保存更新
    this.workspaces.set(uuid, updatedWorkspace);

    return { ...updatedWorkspace };
  }

  /**
   * 更新工作空间设置
   */
  async updateSettings(
    uuid: string,
    settings: Partial<EditorSettings>,
  ): Promise<EditorWorkspace | null> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return null;

    const updatedSettings: EditorSettings = {
      ...workspace.settings,
      ...settings,
    };

    return this.update(uuid, { settings: updatedSettings });
  }

  /**
   * 更新工作空间布局
   */
  async updateLayout(
    uuid: string,
    layout: Partial<WorkspaceLayout>,
  ): Promise<EditorWorkspace | null> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return null;

    const updatedLayout: WorkspaceLayout = {
      ...workspace.layout,
      ...layout,
    };

    return this.update(uuid, { layout: updatedLayout });
  }

  /**
   * 添加打开的文档
   */
  async addOpenDocument(uuid: string, openDocument: OpenDocument): Promise<EditorWorkspace | null> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return null;

    // 检查文档是否已经打开
    const existingIndex = workspace.openDocuments.findIndex(
      (doc) => doc.documentUuid === openDocument.documentUuid,
    );

    if (existingIndex !== -1) {
      // 更新已存在的文档
      workspace.openDocuments[existingIndex] = {
        ...workspace.openDocuments[existingIndex],
        ...openDocument,
        lastActiveAt: Date.now(),
      };
    } else {
      // 添加新文档
      workspace.openDocuments.push({
        ...openDocument,
        lastActiveAt: Date.now(),
      });
    }

    // 设置为当前文档
    const updatedWorkspace: EditorWorkspace = {
      ...workspace,
      currentDocumentUuid: openDocument.documentUuid,
      lastActiveAt: new Date(),
    };

    this.workspaces.set(uuid, updatedWorkspace);
    return { ...updatedWorkspace };
  }

  /**
   * 移除打开的文档
   */
  async removeOpenDocument(uuid: string, documentUuid: string): Promise<EditorWorkspace | null> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return null;

    // 移除文档
    const openDocuments = workspace.openDocuments.filter(
      (doc) => doc.documentUuid !== documentUuid,
    );

    // 如果移除的是当前文档，选择新的当前文档
    let currentDocumentUuid = workspace.currentDocumentUuid;
    if (currentDocumentUuid === documentUuid) {
      currentDocumentUuid = openDocuments.length > 0 ? openDocuments[0].documentUuid : undefined;
    }

    const updatedWorkspace: EditorWorkspace = {
      ...workspace,
      openDocuments,
      currentDocumentUuid,
      lastActiveAt: new Date(),
    };

    this.workspaces.set(uuid, updatedWorkspace);
    return { ...updatedWorkspace };
  }

  /**
   * 设置当前文档
   */
  async setCurrentDocument(uuid: string, documentUuid: string): Promise<EditorWorkspace | null> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return null;

    // 检查文档是否在打开列表中
    const document = workspace.openDocuments.find((doc) => doc.documentUuid === documentUuid);
    if (!document) return null;

    // 更新最后活跃时间
    document.lastActiveAt = Date.now();

    const updatedWorkspace: EditorWorkspace = {
      ...workspace,
      currentDocumentUuid: documentUuid,
      lastActiveAt: new Date(),
    };

    this.workspaces.set(uuid, updatedWorkspace);
    return { ...updatedWorkspace };
  }

  /**
   * 更新文档状态
   */
  async updateDocumentState(
    uuid: string,
    documentUuid: string,
    state: Partial<OpenDocument>,
  ): Promise<EditorWorkspace | null> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return null;

    const documentIndex = workspace.openDocuments.findIndex(
      (doc) => doc.documentUuid === documentUuid,
    );
    if (documentIndex === -1) return null;

    // 更新文档状态
    workspace.openDocuments[documentIndex] = {
      ...workspace.openDocuments[documentIndex],
      ...state,
      lastActiveAt: Date.now(),
    };

    const updatedWorkspace: EditorWorkspace = {
      ...workspace,
      lastActiveAt: new Date(),
    };

    this.workspaces.set(uuid, updatedWorkspace);
    return { ...updatedWorkspace };
  }

  /**
   * 归档工作空间
   */
  async archive(uuid: string): Promise<boolean> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return false;

    workspace.isArchived = true;
    workspace.lastActiveAt = new Date();

    this.workspaces.set(uuid, workspace);
    return true;
  }

  /**
   * 恢复归档的工作空间
   */
  async unarchive(uuid: string): Promise<boolean> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return false;

    workspace.isArchived = false;
    workspace.lastActiveAt = new Date();

    this.workspaces.set(uuid, workspace);
    return true;
  }

  /**
   * 删除工作空间
   */
  async delete(uuid: string): Promise<boolean> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return false;

    // 从所有用户的工作空间列表中移除
    for (const [userId, workspaceSet] of this.userWorkspaces.entries()) {
      workspaceSet.delete(uuid);
      if (workspaceSet.size === 0) {
        this.userWorkspaces.delete(userId);
      }
    }

    // 删除工作空间
    this.workspaces.delete(uuid);
    return true;
  }

  /**
   * 复制工作空间
   */
  async clone(uuid: string, newName: string): Promise<EditorWorkspace | null> {
    const originalWorkspace = this.workspaces.get(uuid);
    if (!originalWorkspace) return null;

    const clonedWorkspace: EditorWorkspace = {
      ...originalWorkspace,
      uuid: this.generateUuid(),
      name: newName,
      openDocuments: [], // 不复制打开的文档
      currentDocumentUuid: undefined,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      metadata: {
        ...originalWorkspace.metadata,
        documentCount: 0,
        totalSize: 0,
      },
    };

    this.workspaces.set(clonedWorkspace.uuid, clonedWorkspace);
    return { ...clonedWorkspace };
  }

  /**
   * 搜索工作空间
   */
  async search(query: string): Promise<EditorWorkspace[]> {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const workspaces = Array.from(this.workspaces.values())
      .filter((ws) => !ws.isArchived)
      .filter(
        (ws) =>
          ws.name.toLowerCase().includes(searchTerm) ||
          ws.description?.toLowerCase().includes(searchTerm) ||
          ws.metadata.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      );

    // 按相关性排序
    workspaces.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, searchTerm);
      const bScore = this.calculateRelevanceScore(b, searchTerm);
      return bScore - aScore;
    });

    return workspaces.map((ws) => ({ ...ws }));
  }

  /**
   * 获取工作空间统计信息
   */
  async getStatistics(uuid: string): Promise<any> {
    const workspace = this.workspaces.get(uuid);
    if (!workspace) return null;

    return {
      totalDocuments: workspace.openDocuments.length,
      activeDocument: workspace.currentDocumentUuid,
      lastActive: workspace.lastActiveAt,
      settings: {
        theme: workspace.settings.theme.name,
        fontSize: workspace.settings.fontSize,
        autoSave: workspace.settings.autoSave.enabled,
      },
      layout: {
        viewMode: workspace.layout.viewMode.mode,
        previewVisible: workspace.layout.isPreviewVisible,
      },
    };
  }

  /**
   * 关联工作空间到用户
   */
  async associateWithUser(workspaceUuid: string, userId: string): Promise<void> {
    if (!this.userWorkspaces.has(userId)) {
      this.userWorkspaces.set(userId, new Set());
    }
    this.userWorkspaces.get(userId)!.add(workspaceUuid);
  }

  /**
   * 取消工作空间与用户的关联
   */
  async dissociateFromUser(workspaceUuid: string, userId: string): Promise<void> {
    const userWorkspaceSet = this.userWorkspaces.get(userId);
    if (userWorkspaceSet) {
      userWorkspaceSet.delete(workspaceUuid);
      if (userWorkspaceSet.size === 0) {
        this.userWorkspaces.delete(userId);
      }
    }
  }

  private calculateRelevanceScore(workspace: EditorWorkspace, searchTerm: string): number {
    let score = 0;

    // 名称匹配
    if (workspace.name.toLowerCase().includes(searchTerm)) {
      score += 50;
      if (workspace.name.toLowerCase().startsWith(searchTerm)) {
        score += 20; // 前缀匹配加分
      }
    }

    // 描述匹配
    if (workspace.description?.toLowerCase().includes(searchTerm)) {
      score += 20;
    }

    // 标签匹配
    for (const tag of workspace.metadata.tags) {
      if (tag.toLowerCase().includes(searchTerm)) {
        score += 15;
      }
    }

    // 最近活跃的工作空间分数更高
    const daysSinceActive = (Date.now() - workspace.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceActive);

    return score;
  }

  private generateUuid(): string {
    return `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultWorkspaces(): void {
    // 可以在这里初始化一些默认工作空间
    const defaultWorkspace: EditorWorkspace = {
      uuid: 'default-workspace',
      name: 'Default Workspace',
      repositoryUuid: 'default-repo',
      description: 'Default workspace for general editing',
      openDocuments: [],
      settings: this.getDefaultSettings(),
      layout: this.getDefaultLayout(),
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isArchived: false,
      metadata: {
        documentCount: 0,
        totalSize: 0,
        tags: ['default'],
        customProperties: {},
      },
    };

    this.workspaces.set(defaultWorkspace.uuid, defaultWorkspace);
  }

  private getDefaultSettings(): EditorSettings {
    return {
      theme: {
        name: 'vs-dark',
        mode: 'dark',
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineHeight: 1.5,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      autoSave: {
        enabled: true,
        delay: 1000,
        onFocusChange: true,
        onWindowChange: true,
      },
      syntax: {
        highlighting: true,
        validation: true,
        autocompletion: true,
        formatOnSave: false,
      },
    };
  }

  private getDefaultLayout(): WorkspaceLayout {
    return {
      sidebarWidth: 250,
      editorWidth: 800,
      previewWidth: 400,
      isPreviewVisible: false,
      panelSizes: {
        explorer: 200,
        search: 200,
        extensions: 200,
        terminal: 200,
      },
      viewMode: {
        mode: 'edit',
        previewSync: true,
        previewPosition: 'right',
      },
      splitDirection: 'horizontal',
    };
  }
}
