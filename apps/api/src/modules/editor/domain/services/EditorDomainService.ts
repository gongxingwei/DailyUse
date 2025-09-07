/**
 * Editor Domain Service
 * 编辑器领域服务 - 实现核心业务逻辑
 */

import { EditorContracts, type CoreContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type IEditorTab = EditorContracts.IEditorTab;
type IEditorGroup = EditorContracts.IEditorGroup;
type IEditorLayout = EditorContracts.IEditorLayout;
type IOpenFileCommand = EditorContracts.IOpenFileCommand;
type ICloseTabCommand = EditorContracts.ICloseTabCommand;
type ISplitEditorCommand = EditorContracts.ISplitEditorCommand;
type IResizeEditorCommand = EditorContracts.IResizeEditorCommand;

export class EditorDomainService {
  /**
   * 确定文件类型
   */
  public determineFileType(path: string): EditorContracts.SupportedFileType {
    const extension = path.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'md':
      case 'markdown':
        return EditorContracts.SupportedFileType.MARKDOWN;
      case 'js':
      case 'jsx':
        return EditorContracts.SupportedFileType.JAVASCRIPT;
      case 'ts':
      case 'tsx':
        return EditorContracts.SupportedFileType.TYPESCRIPT;
      case 'json':
        return EditorContracts.SupportedFileType.JSON;
      case 'html':
      case 'htm':
        return EditorContracts.SupportedFileType.HTML;
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return EditorContracts.SupportedFileType.CSS;
      case 'py':
        return EditorContracts.SupportedFileType.PYTHON;
      case 'txt':
      case 'text':
        return EditorContracts.SupportedFileType.TEXT;
      default:
        return EditorContracts.SupportedFileType.UNKNOWN;
    }
  }

  /**
   * 验证编辑器标签页
   */
  public validateEditorTab(tab: Partial<IEditorTab>): void {
    if (!tab.uuid) {
      throw new EditorContracts.EditorError('Editor tab UUID is required', 'INVALID_TAB_UUID');
    }

    if (!tab.path) {
      throw new EditorContracts.EditorError('Editor tab path is required', 'INVALID_TAB_PATH');
    }

    if (!tab.title) {
      throw new EditorContracts.EditorError('Editor tab title is required', 'INVALID_TAB_TITLE');
    }
  }

  /**
   * 验证编辑器组
   */
  public validateEditorGroup(group: Partial<IEditorGroup>): void {
    if (!group.uuid) {
      throw new EditorContracts.EditorGroupError('Editor group UUID is required', group.uuid || '');
    }

    if (group.width && group.width < 200) {
      throw new EditorContracts.EditorGroupError(
        'Editor group width must be at least 200px',
        group.uuid || '',
      );
    }

    if (group.tabs) {
      group.tabs.forEach((tab: Partial<IEditorTab>) => this.validateEditorTab(tab));
    }
  }

  /**
   * 计算最优编辑器组宽度分布
   */
  public calculateOptimalGroupWidths(
    groups: IEditorGroup[],
    totalWidth: number,
    minWidth: number = 300,
  ): { groupId: string; width: number }[] {
    if (groups.length === 0) {
      return [];
    }

    const availableWidth = totalWidth;
    const groupCount = groups.length;

    // 如果总宽度不足以容纳所有组的最小宽度
    if (availableWidth < groupCount * minWidth) {
      return groups.map((group) => ({
        groupId: group.uuid,
        width: minWidth,
      }));
    }

    // 计算每个组应该获得的宽度
    const baseWidth = Math.floor(availableWidth / groupCount);
    const remainder = availableWidth % groupCount;

    return groups.map((group, index) => ({
      groupId: group.uuid,
      width: baseWidth + (index < remainder ? 1 : 0),
    }));
  }

  /**
   * 处理编辑器组分割逻辑
   */
  public calculateSplitGroupDimensions(
    sourceGroup: IEditorGroup,
    direction: 'horizontal' | 'vertical',
  ): { sourceWidth: number; newWidth: number; sourceHeight?: number; newHeight?: number } {
    if (direction === 'horizontal') {
      // 水平分割：左右分布
      const halfWidth = Math.floor(sourceGroup.width / 2);
      return {
        sourceWidth: halfWidth,
        newWidth: sourceGroup.width - halfWidth,
      };
    } else {
      // 垂直分割：上下分布 (暂时不实现高度分割)
      return {
        sourceWidth: sourceGroup.width,
        newWidth: sourceGroup.width,
        sourceHeight: 300, // TODO: 从布局中获取实际高度
        newHeight: 300,
      };
    }
  }

  /**
   * 生成唯一的编辑器组ID
   */
  public generateGroupId(): string {
    return `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成唯一的标签页ID
   */
  public generateTabId(path: string, isPreview: boolean = false): string {
    const prefix = isPreview ? 'preview-' : '';
    return `${prefix}${path}`;
  }

  /**
   * 创建标签页实体
   */
  public createEditorTab(command: IOpenFileCommand): IEditorTab {
    const fileType = this.determineFileType(command.path);
    const title = this.extractFileName(command.path);

    const tab: IEditorTab = {
      uuid: this.generateTabId(command.path, command.isPreview),
      title: command.isPreview ? `Preview: ${title}` : title,
      path: command.path,
      active: true,
      isPreview: command.isPreview || false,
      fileType: fileType,
      isDirty: false,
      lastModified: new Date(),
    };

    this.validateEditorTab(tab);
    return tab;
  }

  /**
   * 创建编辑器组实体
   */
  public createEditorGroup(width: number = 600): IEditorGroup {
    const group: IEditorGroup = {
      uuid: this.generateGroupId(),
      active: true,
      width: Math.max(width, 200),
      tabs: [],
      activeTabId: null,
      lastAccessed: new Date(),
    };

    this.validateEditorGroup(group);
    return group;
  }

  /**
   * 从路径提取文件名
   */
  private extractFileName(path: string): string {
    return path.split(/[/\\]/).pop() || path;
  }

  /**
   * 检查文件路径是否有效
   */
  public validateFilePath(path: string): void {
    if (!path || path.trim() === '') {
      throw new EditorContracts.FileOperationError(
        'File path cannot be empty',
        EditorContracts.FileOperationType.OPEN,
        path,
      );
    }

    // TODO: 添加更多路径验证逻辑
    // - 检查路径格式
    // - 检查文件扩展名
    // - 检查路径长度限制
  }

  /**
   * 检查编辑器组是否可以关闭
   */
  public canCloseEditorGroup(group: IEditorGroup): { canClose: boolean; reason?: string } {
    if (group.tabs.length === 0) {
      return { canClose: true };
    }

    const unsavedTabs = group.tabs.filter((tab) => tab.isDirty);
    if (unsavedTabs.length > 0) {
      return {
        canClose: false,
        reason: `${unsavedTabs.length} unsaved file(s) in this group`,
      };
    }

    return { canClose: true };
  }

  /**
   * 处理编辑器布局更新逻辑
   */
  public processLayoutUpdate(
    currentLayout: IEditorLayout,
    updates: Partial<IEditorLayout>,
  ): IEditorLayout {
    const newLayout: IEditorLayout = {
      ...currentLayout,
      ...updates,
    };

    // 验证布局约束
    if (newLayout.sidebarWidth < newLayout.minSidebarWidth) {
      newLayout.sidebarWidth = newLayout.minSidebarWidth;
    }

    if (newLayout.windowWidth < 800) {
      throw new EditorContracts.EditorError(
        'Window width must be at least 800px',
        'INVALID_LAYOUT',
      );
    }

    if (newLayout.windowHeight < 600) {
      throw new EditorContracts.EditorError(
        'Window height must be at least 600px',
        'INVALID_LAYOUT',
      );
    }

    return newLayout;
  }

  /**
   * 计算编辑器区域可用宽度
   */
  public calculateEditorAreaWidth(layout: IEditorLayout, sidebarVisible: boolean): number {
    const baseWidth = layout.windowWidth - layout.activityBarWidth - layout.resizeHandleWidth;
    const sidebarWidth = sidebarVisible ? layout.sidebarWidth : 0;
    return Math.max(baseWidth - sidebarWidth, layout.minEditorWidth);
  }
}
