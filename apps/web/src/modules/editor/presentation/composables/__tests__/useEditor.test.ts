import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEditor } from '../useEditor';
import { useEditorStore } from '../../stores/editorStore';
import { EditorWebApplicationService } from '../../../application/services/EditorWebApplicationService';
import { createMockStore } from '../../../../../../../tests/utils/testHelpers';

// Mock dependencies
vi.mock('../../stores/editorStore');
vi.mock('../../../application/services/EditorWebApplicationService');

describe('useEditor', () => {
  let mockEditorStore: any;
  let mockApplicationService: any;

  beforeEach(() => {
    // 创建 mock store
    mockEditorStore = createMockStore({
      getAllFiles: [],
      currentFile: null,
      openedFiles: [],
      recentFiles: [],
      getAllEditorGroups: [],
      activeEditorGroup: null,
      getSourceControlRepositories: [],
      getFileChanges: [],
      getStagedChanges: [],
      layout: { sidebarWidth: 250 },
      ui: { isSidebarVisible: true, activePanel: null },
      settings: { theme: 'light' },
      isLoading: false,
      error: null,
      isInitialized: false,
    });

    // 创建 mock application service
    mockApplicationService = {
      openFile: vi.fn().mockResolvedValue({}),
      closeFile: vi.fn().mockResolvedValue({}),
      createGroup: vi.fn().mockResolvedValue({}),
      getGroups: vi.fn().mockResolvedValue([]),
      deleteGroup: vi.fn().mockResolvedValue({}),
      syncAllEditorData: vi.fn().mockResolvedValue({}),
      shouldSyncData: vi.fn().mockReturnValue(false),
      forceSync: vi.fn().mockResolvedValue({}),
      initialize: vi.fn().mockResolvedValue({}),
    };

    // Mock constructors
    vi.mocked(useEditorStore).mockReturnValue(mockEditorStore);
    vi.mocked(EditorWebApplicationService).mockImplementation(() => mockApplicationService);
  });

  describe('初始化', () => {
    it('应该正确初始化 composable', () => {
      const editor = useEditor();

      expect(editor).toBeDefined();
      expect(editor.state).toBeDefined();
      expect(editor.files).toBeDefined();
      expect(editor.editorGroups).toBeDefined();
      expect(editor.sourceControl).toBeDefined();
      expect(editor.layout).toBeDefined();
      expect(editor.settings).toBeDefined();
      expect(editor.sync).toBeDefined();
      expect(editor.utils).toBeDefined();
    });

    it('应该正确获取状态属性', () => {
      const editor = useEditor();

      expect(editor.state.files).toBeDefined();
      expect(editor.state.currentFile).toBeDefined();
      expect(editor.state.openFiles).toBeDefined();
      expect(editor.state.editorGroups).toBeDefined();
      expect(editor.state.layout).toBeDefined();
      expect(editor.state.isLoading).toBeDefined();
      expect(editor.state.error).toBeDefined();
      expect(editor.state.isInitialized).toBeDefined();
    });
  });

  describe('文件操作', () => {
    it('应该提供文件操作方法', () => {
      const editor = useEditor();

      expect(typeof editor.files.create).toBe('function');
      expect(typeof editor.files.getAll).toBe('function');
      expect(typeof editor.files.getContent).toBe('function');
      expect(typeof editor.files.saveContent).toBe('function');
      expect(typeof editor.files.delete).toBe('function');
      expect(typeof editor.files.rename).toBe('function');
      expect(typeof editor.files.open).toBe('function');
      expect(typeof editor.files.close).toBe('function');
      expect(typeof editor.files.switchTo).toBe('function');
      expect(typeof editor.files.getByPath).toBe('function');
      expect(typeof editor.files.isOpen).toBe('function');
    });

    it('应该能够打开文件', async () => {
      const editor = useEditor();
      const sessionUuid = 'session-1';
      const groupUuid = 'group-1';
      const path = '/test/file.ts';

      await editor.files.open(path, sessionUuid, groupUuid);

      expect(mockApplicationService.openFile).toHaveBeenCalledWith(sessionUuid, groupUuid, path);
    });

    it('应该能够关闭文件', async () => {
      const editor = useEditor();
      const sessionUuid = 'session-1';
      const groupUuid = 'group-1';
      const tabUuid = 'tab-1';

      await editor.files.close(tabUuid, sessionUuid, groupUuid);

      expect(mockApplicationService.closeFile).toHaveBeenCalledWith(
        sessionUuid,
        groupUuid,
        tabUuid,
      );
    });

    it('应该在缺少必要参数时抛出错误', async () => {
      const editor = useEditor();

      await expect(editor.files.open('/test/file.ts')).rejects.toThrow(
        'sessionUuid and groupUuid are required',
      );
      await expect(editor.files.close('tab-1')).rejects.toThrow(
        'sessionUuid and groupUuid are required',
      );
    });
  });

  describe('编辑器组操作', () => {
    it('应该提供编辑器组操作方法', () => {
      const editor = useEditor();

      expect(typeof editor.editorGroups.create).toBe('function');
      expect(typeof editor.editorGroups.getAll).toBe('function');
      expect(typeof editor.editorGroups.delete).toBe('function');
      expect(typeof editor.editorGroups.setCurrent).toBe('function');
      expect(typeof editor.editorGroups.getById).toBe('function');
    });

    it('应该能够创建编辑器组', async () => {
      const editor = useEditor();
      const sessionUuid = 'session-1';
      const request = { name: 'Test Group', position: 'right' as const };

      await editor.editorGroups.create(request, sessionUuid);

      expect(mockApplicationService.createGroup).toHaveBeenCalledWith(sessionUuid, {
        width: 400,
        title: request.name,
        order: 0,
      });
    });

    it('应该能够获取所有编辑器组', async () => {
      const editor = useEditor();
      const sessionUuid = 'session-1';

      await editor.editorGroups.getAll(sessionUuid);

      expect(mockApplicationService.getGroups).toHaveBeenCalledWith(sessionUuid);
    });

    it('应该能够删除编辑器组', async () => {
      const editor = useEditor();
      const sessionUuid = 'session-1';
      const groupUuid = 'group-1';

      await editor.editorGroups.delete(groupUuid, sessionUuid);

      expect(mockApplicationService.deleteGroup).toHaveBeenCalledWith(sessionUuid, groupUuid);
    });

    it('应该在缺少会话UUID时抛出错误', async () => {
      const editor = useEditor();

      await expect(editor.editorGroups.create({ name: 'Test' })).rejects.toThrow(
        'sessionUuid is required',
      );
      await expect(editor.editorGroups.getAll()).rejects.toThrow('sessionUuid is required');
      await expect(editor.editorGroups.delete('group-1')).rejects.toThrow(
        'sessionUuid is required',
      );
    });
  });

  describe('源码控制', () => {
    it('应该提供源码控制方法', () => {
      const editor = useEditor();

      expect(typeof editor.sourceControl.getRepositories).toBe('function');
      expect(typeof editor.sourceControl.getFileChanges).toBe('function');
      expect(typeof editor.sourceControl.stageFile).toBe('function');
      expect(typeof editor.sourceControl.unstageFile).toBe('function');
      expect(typeof editor.sourceControl.commitChanges).toBe('function');
    });

    it('源码控制方法应该返回未实现的提示', async () => {
      const editor = useEditor();

      const repos = await editor.sourceControl.getRepositories();
      expect(repos).toEqual([]);

      const changes = await editor.sourceControl.getFileChanges();
      expect(changes).toEqual([]);

      await expect(editor.sourceControl.stageFile('/test')).rejects.toThrow(
        'Method not implemented in new architecture',
      );
      await expect(editor.sourceControl.unstageFile('/test')).rejects.toThrow(
        'Method not implemented in new architecture',
      );
      await expect(editor.sourceControl.commitChanges('test')).rejects.toThrow(
        'Method not implemented in new architecture',
      );
    });
  });

  describe('布局操作', () => {
    it('应该提供布局操作方法', () => {
      const editor = useEditor();

      expect(typeof editor.layout.setLayout).toBe('function');
      expect(typeof editor.layout.toggleSidebar).toBe('function');
      expect(typeof editor.layout.togglePanel).toBe('function');
      expect(typeof editor.layout.setEditorAreaLayout).toBe('function');
    });

    it('应该能够切换侧边栏', () => {
      const editor = useEditor();

      editor.layout.toggleSidebar();

      expect(mockEditorStore.toggleSidebarVisibility).toHaveBeenCalled();
    });

    it('应该能够切换面板', () => {
      const editor = useEditor();

      editor.layout.togglePanel('terminal');

      expect(mockEditorStore.setActivePanel).toHaveBeenCalledWith('terminal');
    });
  });

  describe('设置操作', () => {
    it('应该提供设置操作方法', () => {
      const editor = useEditor();

      expect(typeof editor.settings.updateEditorSettings).toBe('function');
      expect(typeof editor.settings.resetToDefaults).toBe('function');
    });

    it('应该能够更新编辑器设置', () => {
      const editor = useEditor();
      const settings = { theme: 'dark', fontSize: 16 };

      editor.settings.updateEditorSettings(settings);

      expect(mockEditorStore.updateSettings).toHaveBeenCalledWith(settings);
    });

    it('应该能够重置设置为默认值', () => {
      const editor = useEditor();

      editor.settings.resetToDefaults();

      expect(mockEditorStore.updateSettings).toHaveBeenCalledWith({
        theme: 'light',
        fontSize: 14,
        wordWrap: true,
        autoSave: true,
        minimap: true,
      });
    });
  });

  describe('数据同步', () => {
    it('应该提供同步操作方法', () => {
      const editor = useEditor();

      expect(typeof editor.sync.syncAll).toBe('function');
      expect(typeof editor.sync.shouldSync).toBe('function');
      expect(typeof editor.sync.forceSync).toBe('function');
      expect(typeof editor.sync.initialize).toBe('function');
    });

    it('应该能够同步所有数据', async () => {
      const editor = useEditor();

      await editor.sync.syncAll();

      expect(mockApplicationService.syncAllEditorData).toHaveBeenCalled();
    });

    it('应该能够强制同步', async () => {
      const editor = useEditor();

      await editor.sync.forceSync();

      expect(mockApplicationService.forceSync).toHaveBeenCalled();
    });

    it('应该能够初始化服务', async () => {
      const editor = useEditor();

      await editor.sync.initialize();

      expect(mockApplicationService.initialize).toHaveBeenCalled();
    });
  });

  describe('工具方法', () => {
    it('应该提供工具方法', () => {
      const editor = useEditor();

      expect(typeof editor.utils.clearError).toBe('function');
      expect(typeof editor.utils.getApplicationService).toBe('function');
      expect(typeof editor.utils.getStore).toBe('function');
      expect(typeof editor.utils.refreshCache).toBe('function');
    });

    it('应该能够清除错误', () => {
      const editor = useEditor();

      editor.utils.clearError();

      expect(mockEditorStore.setError).toHaveBeenCalledWith(null);
    });

    it('应该能够获取服务和store实例', () => {
      const editor = useEditor();

      const service = editor.utils.getApplicationService();
      const store = editor.utils.getStore();

      expect(service).toBeDefined();
      expect(store).toBe(mockEditorStore);
    });

    it('应该能够刷新缓存', async () => {
      const editor = useEditor();

      await editor.utils.refreshCache();

      expect(mockApplicationService.forceSync).toHaveBeenCalled();
    });
  });

  describe('状态读取', () => {
    it('应该正确读取store状态', () => {
      const editor = useEditor();

      expect(editor.state.files).toEqual([]);
      expect(editor.state.currentFile).toBeNull();
      expect(editor.state.isLoading).toBe(false);
      expect(editor.state.error).toBeNull();
    });

    it('应该正确读取布局状态', () => {
      const editor = useEditor();

      expect(editor.state.layout).toEqual({ sidebarWidth: 250 });
      expect(editor.state.sidebarVisible).toBe(true);
      expect(editor.state.panelVisible).toBe(false);
    });
  });

  describe('错误处理', () => {
    it('未实现的方法应该抛出适当的错误', async () => {
      const editor = useEditor();

      await expect(editor.files.create({ path: '/test' })).rejects.toThrow(
        'Method not implemented in new architecture',
      );
      await expect(editor.files.getAll()).rejects.toThrow(
        'Method not implemented in new architecture',
      );
      await expect(editor.files.getContent('/test')).rejects.toThrow(
        'Method not implemented in new architecture',
      );
      await expect(editor.files.saveContent('/test', 'content')).rejects.toThrow(
        'Method not implemented in new architecture',
      );
      await expect(editor.files.delete('/test')).rejects.toThrow(
        'Method not implemented in new architecture',
      );
      await expect(editor.files.rename('/old', '/new')).rejects.toThrow(
        'Method not implemented in new architecture',
      );
    });
  });
});
