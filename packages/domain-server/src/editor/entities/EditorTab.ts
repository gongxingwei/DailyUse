import { EditorTabCore } from '@dailyuse/domain-core';
import { type EditorContracts } from '@dailyuse/contracts';

// 获取类型定义
type EditorTabDTO = EditorContracts.EditorTabDTO;
type SupportedFileType = EditorContracts.SupportedFileType;

/**
 * 服务端 EditorTab 实体
 * 继承核心 EditorTab 类，添加服务端特有功能
 */
export class EditorTab extends EditorTabCore {
  private _bookmarks: number[];
  private _foldedLines: number[];
  private _customSettings?: Record<string, any>;
  private _collaborators?: string[];

  constructor(params: {
    uuid?: string;
    title: string;
    path: string;
    active?: boolean;
    isPreview?: boolean;
    fileType?: SupportedFileType;
    isDirty?: boolean;
    content?: string;
    lastModified?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    // 服务端特有字段
    bookmarks?: number[];
    foldedLines?: number[];
    customSettings?: Record<string, any>;
    collaborators?: string[];
  }) {
    super(params);

    this._bookmarks = params.bookmarks || [];
    this._foldedLines = params.foldedLines || [];
    this._customSettings = params.customSettings;
    this._collaborators = params.collaborators;
  }

  // ===== 实现抽象方法 =====

  /**
   * 转换为DTO
   */
  toDTO(): EditorTabDTO {
    return {
      uuid: this.uuid,
      title: this.title,
      groupUuid: '1',
      path: this.path,
      active: this.active,
      isPreview: this.isPreview,
      fileType: this.fileType,
      isDirty: this.isDirty,
      content: this.content,
      lastModified: this.lastModified?.getTime(),
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }

  // ===== Getter 方法 =====
  get bookmarks(): number[] {
    return [...this._bookmarks];
  }
  get foldedLines(): number[] {
    return [...this._foldedLines];
  }
  get customSettings(): Record<string, any> | undefined {
    return this._customSettings;
  }
  get collaborators(): string[] | undefined {
    return this._collaborators ? [...this._collaborators] : undefined;
  }

  // ===== 服务端特有方法 =====

  /**
   * 添加书签
   */
  addBookmark(line: number): void {
    if (line < 1) {
      throw new Error('行号必须大于0');
    }
    if (!this._bookmarks.includes(line)) {
      this._bookmarks.push(line);
      this._bookmarks.sort((a, b) => a - b);
      this.updateTimestamp();
    }
  }

  /**
   * 移除书签
   */
  removeBookmark(line: number): void {
    const index = this._bookmarks.indexOf(line);
    if (index !== -1) {
      this._bookmarks.splice(index, 1);
      this.updateTimestamp();
    }
  }

  /**
   * 切换书签
   */
  toggleBookmark(line: number): void {
    if (this._bookmarks.includes(line)) {
      this.removeBookmark(line);
    } else {
      this.addBookmark(line);
    }
  }

  /**
   * 清除所有书签
   */
  clearBookmarks(): void {
    if (this._bookmarks.length > 0) {
      this._bookmarks = [];
      this.updateTimestamp();
    }
  }

  /**
   * 折叠代码行
   */
  foldLine(line: number): void {
    if (line < 1) {
      throw new Error('行号必须大于0');
    }
    if (!this._foldedLines.includes(line)) {
      this._foldedLines.push(line);
      this._foldedLines.sort((a, b) => a - b);
      this.updateTimestamp();
    }
  }

  /**
   * 展开代码行
   */
  unfoldLine(line: number): void {
    const index = this._foldedLines.indexOf(line);
    if (index !== -1) {
      this._foldedLines.splice(index, 1);
      this.updateTimestamp();
    }
  }

  /**
   * 切换代码折叠
   */
  toggleFold(line: number): void {
    if (this._foldedLines.includes(line)) {
      this.unfoldLine(line);
    } else {
      this.foldLine(line);
    }
  }

  /**
   * 展开所有折叠
   */
  unfoldAll(): void {
    if (this._foldedLines.length > 0) {
      this._foldedLines = [];
      this.updateTimestamp();
    }
  }

  /**
   * 更新自定义设置
   */
  updateCustomSettings(settings: Record<string, any>): void {
    this._customSettings = { ...this._customSettings, ...settings };
    this.updateTimestamp();
  }

  /**
   * 添加协作者
   */
  addCollaborator(userId: string): void {
    if (!this._collaborators) {
      this._collaborators = [];
    }
    if (!this._collaborators.includes(userId)) {
      this._collaborators.push(userId);
      this.updateTimestamp();
    }
  }

  /**
   * 移除协作者
   */
  removeCollaborator(userId: string): void {
    if (this._collaborators) {
      const index = this._collaborators.indexOf(userId);
      if (index !== -1) {
        this._collaborators.splice(index, 1);
        this.updateTimestamp();
      }
    }
  }

  /**
   * 检查是否为协作者
   */
  isCollaborator(userId: string): boolean {
    return this._collaborators?.includes(userId) || false;
  }

  /**
   * 获取持久化数据
   */
  toPersistenceData(): Record<string, any> {
    return {
      uuid: this.uuid,
      title: this.title,
      path: this.path,
      active: this.active,
      isPreview: this.isPreview,
      fileType: this.fileType,
      isDirty: this.isDirty,
      content: this.content,
      lastModified: this.lastModified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      bookmarks: this._bookmarks,
      foldedLines: this._foldedLines,
      customSettings: this._customSettings,
      collaborators: this._collaborators,
    };
  }

  /**
   * 标记为已保存
   */
  markAsSaved(): void {
    this.setDirty(false);
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string {
    const parts = this.path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * 检查是否为图片文件
   */
  isImageFile(): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    return imageExtensions.includes(this.getFileExtension());
  }

  /**
   * 检查是否为文本文件
   */
  isTextFile(): boolean {
    const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'log'];
    return textExtensions.includes(this.getFileExtension());
  }

  /**
   * 检查是否为代码文件
   */
  isCodeFile(): boolean {
    const codeExtensions = [
      'js',
      'ts',
      'jsx',
      'tsx',
      'vue',
      'py',
      'java',
      'cpp',
      'c',
      'cs',
      'php',
      'rb',
      'go',
      'rs',
      'swift',
    ];
    return codeExtensions.includes(this.getFileExtension());
  }
}
