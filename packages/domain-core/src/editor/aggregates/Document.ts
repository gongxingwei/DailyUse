import { DocumentMetadata } from '../value-objects/DocumentMetadata';
import { ContentChange, ChangeType } from '../entities/ContentChange';

// 临时类型定义
enum DocumentFormat {
  MARKDOWN = 'markdown',
  PLAINTEXT = 'plaintext',
  HTML = 'html',
  JSON = 'json',
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
}

enum RenderingMode {
  SOURCE_ONLY = 'source',
  PREVIEW_ONLY = 'preview',
  SPLIT_VIEW = 'split',
  WYSIWYG = 'wysiwyg',
}

interface EntityLifecycle {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;
}

interface LinkedResource {
  uuid: string;
  type: string;
  relativePath: string;
  size: number;
  mimeType: string;
  thumbnailPath?: string;
}

interface IDocumentVersion {
  uuid: string;
  documentUuid: string;
  versionNumber: number;
  content: string;
  changeSet: ContentChange[];
  author: string;
  createdAt: number;
  description?: string;
}

interface RenderingState {
  mode: RenderingMode;
  isLivePreview: boolean;
  cursorInRenderedView: boolean;
  renderedContent: RenderedContent;
  sourceMap: SourceMap;
}

interface RenderedContent {
  html: string;
  toc: TableOfContents;
  codeBlocks: CodeBlock[];
  mathBlocks: MathBlock[];
  imageReferences: ImageReference[];
}

interface SourceMap {
  mappings: SourceMapping[];
}

interface SourceMapping {
  sourceStart: any;
  sourceEnd: any;
  renderedStart: any;
  renderedEnd: any;
  elementType: string;
}

interface TableOfContents {
  items: TocItem[];
}

interface TocItem {
  level: number;
  title: string;
  anchor: string;
  children: TocItem[];
}

interface CodeBlock {
  uuid: string;
  language: string;
  code: string;
  startLine: number;
  endLine: number;
}

interface MathBlock {
  uuid: string;
  formula: string;
  isInline: boolean;
  startPosition: any;
  endPosition: any;
}

interface ImageReference {
  uuid: string;
  src: string;
  alt: string;
  title?: string;
  position: any;
}

interface IContentChange {
  uuid: string;
  type: string;
  position: any;
  length: number;
  oldText: string;
  newText: string;
  timestamp: number;
}

interface IDocument {
  uuid: string;
  repositoryUuid: string;
  relativePath: string;
  fileName: string;
  title: string;
  content: string;
  format: DocumentFormat;
  metadata: DocumentMetadata;
  tags: string[];
  resources: LinkedResource[];
  versions: IDocumentVersion[];
  renderingState: RenderingState;
  lifecycle: EntityLifecycle;
}

/**
 * 文档版本实体
 */
export class DocumentVersion implements IDocumentVersion {
  constructor(
    public readonly uuid: string,
    public readonly documentUuid: string,
    public readonly versionNumber: number,
    public readonly content: string,
    public readonly changeSet: ContentChange[],
    public readonly author: string,
    public readonly createdAt: number,
    public readonly description?: string,
  ) {
    if (!uuid.trim()) {
      throw new Error('Version UUID cannot be empty');
    }

    if (!documentUuid.trim()) {
      throw new Error('Document UUID cannot be empty');
    }

    if (versionNumber < 0) {
      throw new Error('Version number must be non-negative');
    }

    if (!author.trim()) {
      throw new Error('Author cannot be empty');
    }

    if (createdAt <= 0) {
      throw new Error('Creation timestamp must be positive');
    }
  }

  /**
   * 计算版本内容大小
   */
  getContentSize(): number {
    return this.content.length;
  }

  /**
   * 获取变更数量
   */
  getChangeCount(): number {
    return this.changeSet.length;
  }

  /**
   * 检查是否包含特定类型的变更
   */
  hasChangeType(changeType: string): boolean {
    return this.changeSet.some((change) => change.type === (changeType as any));
  }

  equals(other: DocumentVersion): boolean {
    return this.uuid === other.uuid;
  }
}

/**
 * 文档聚合根
 */
export class Document implements IDocument {
  private _domainEvents: any[] = [];

  constructor(
    public readonly uuid: string,
    public readonly repositoryUuid: string,
    private _relativePath: string,
    private _fileName: string,
    private _title: string,
    private _content: string,
    private _format: DocumentFormat,
    private _metadata: DocumentMetadata,
    private _tags: string[],
    private _resources: LinkedResource[],
    private _versions: DocumentVersion[],
    private _renderingState: RenderingState,
    private _lifecycle: EntityLifecycle,
  ) {
    if (!uuid.trim()) {
      throw new Error('Document UUID cannot be empty');
    }

    if (!repositoryUuid.trim()) {
      throw new Error('Repository UUID cannot be empty');
    }

    if (!_relativePath.trim()) {
      throw new Error('Relative path cannot be empty');
    }

    if (!_fileName.trim()) {
      throw new Error('File name cannot be empty');
    }

    if (!_title.trim()) {
      throw new Error('Title cannot be empty');
    }
  }

  // Getters
  get relativePath(): string {
    return this._relativePath;
  }
  get fileName(): string {
    return this._fileName;
  }
  get title(): string {
    return this._title;
  }
  get content(): string {
    return this._content;
  }
  get format(): DocumentFormat {
    return this._format;
  }
  get metadata(): DocumentMetadata {
    return this._metadata;
  }
  get tags(): string[] {
    return [...this._tags];
  }
  get resources(): LinkedResource[] {
    return [...this._resources];
  }
  get versions(): DocumentVersion[] {
    return [...this._versions];
  }
  get renderingState(): RenderingState {
    return this._renderingState;
  }
  get lifecycle(): EntityLifecycle {
    return this._lifecycle;
  }

  /**
   * 更新内容
   */
  updateContent(newContent: string, changes: IContentChange[]): void {
    if (this._content === newContent) {
      return; // No change
    }

    const oldContent = this._content;
    this._content = newContent;

    // 更新元数据统计
    this._metadata = this._metadata.updateStats(this.countWords(newContent), newContent.length);

    // 创建新版本
    const newVersion = new DocumentVersion(
      this.generateVersionUuid(),
      this.uuid,
      this._versions.length + 1,
      newContent,
      changes.map((change) =>
        ContentChange.from({
          ...change,
          type: change.type as ChangeType,
        }),
      ),
      'current-user', // TODO: Get from context
      Date.now(),
      `Content updated: ${changes.length} changes`,
    );

    this._versions.push(newVersion);

    // 更新生命周期
    this._lifecycle = {
      ...this._lifecycle,
      updatedAt: new Date(),
      version: this._lifecycle.version + 1,
    };

    // 添加领域事件
    this.addDomainEvent({
      eventType: 'DocumentUpdated',
      aggregateId: this.uuid,
      eventData: {
        documentUuid: this.uuid,
        changes,
        newWordCount: this._metadata.wordCount,
        updatedTags: this._tags,
      },
    });
  }

  /**
   * 更新元数据
   */
  updateMetadata(metadata: Partial<DocumentMetadata>): void {
    // 这里需要实现部分更新逻辑
    const currentMeta = this._metadata;

    this._metadata = new DocumentMetadata(
      metadata.tags !== undefined ? metadata.tags : currentMeta.tags,
      metadata.category !== undefined ? metadata.category : currentMeta.category,
      metadata.wordCount !== undefined ? metadata.wordCount : currentMeta.wordCount,
      metadata.characterCount !== undefined ? metadata.characterCount : currentMeta.characterCount,
      metadata.readingTime !== undefined ? metadata.readingTime : currentMeta.readingTime,
      metadata.lastSavedAt !== undefined ? metadata.lastSavedAt : currentMeta.lastSavedAt,
      metadata.isReadOnly !== undefined ? metadata.isReadOnly : currentMeta.isReadOnly,
      metadata.encoding !== undefined ? metadata.encoding : currentMeta.encoding,
      metadata.language !== undefined ? metadata.language : currentMeta.language,
    );

    this._lifecycle = {
      ...this._lifecycle,
      updatedAt: new Date(),
      version: this._lifecycle.version + 1,
    };
  }

  /**
   * 设置渲染模式
   */
  setRenderingMode(mode: RenderingMode): void {
    this._renderingState = {
      ...this._renderingState,
      mode,
    };
  }

  /**
   * 生成目录
   */
  generateTableOfContents(): void {
    // TODO: 实现目录生成逻辑
    const toc = this.extractTableOfContents();
    this._renderingState = {
      ...this._renderingState,
      renderedContent: {
        ...this._renderingState.renderedContent,
        toc,
      },
    };
  }

  /**
   * 保存文档
   */
  async save(): Promise<void> {
    // 更新最后保存时间
    this._metadata = this._metadata.updateStats(
      this._metadata.wordCount,
      this._metadata.characterCount,
    );

    this._lifecycle = {
      ...this._lifecycle,
      updatedAt: new Date(),
      version: this._lifecycle.version + 1,
    };

    // 添加领域事件
    this.addDomainEvent({
      eventType: 'DocumentSaved',
      aggregateId: this.uuid,
      eventData: {
        documentUuid: this.uuid,
        savedAt: Date.now(),
      },
    });
  }

  /**
   * 重新加载文档
   */
  async reload(): Promise<void> {
    // TODO: 从存储重新加载内容
    this.addDomainEvent({
      eventType: 'DocumentReloaded',
      aggregateId: this.uuid,
      eventData: {
        documentUuid: this.uuid,
        reloadedAt: Date.now(),
      },
    });
  }

  /**
   * 导出文档
   */
  async export(format: DocumentFormat): Promise<string> {
    // TODO: 实现格式转换逻辑
    switch (format) {
      case DocumentFormat.MARKDOWN:
        return this._content;
      case DocumentFormat.HTML:
        return this.convertToHtml();
      default:
        throw new Error(`Export format not supported: ${format}`);
    }
  }

  /**
   * 添加标签
   */
  addTag(tag: string): void {
    if (!tag.trim()) {
      throw new Error('Tag cannot be empty');
    }

    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
      this._metadata = this._metadata.addTag(tag);

      this._lifecycle = {
        ...this._lifecycle,
        updatedAt: new Date(),
        version: this._lifecycle.version + 1,
      };
    }
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index !== -1) {
      this._tags.splice(index, 1);
      this._metadata = this._metadata.removeTag(tag);

      this._lifecycle = {
        ...this._lifecycle,
        updatedAt: new Date(),
        version: this._lifecycle.version + 1,
      };
    }
  }

  /**
   * 添加资源
   */
  addResource(resource: LinkedResource): void {
    if (!this._resources.find((r) => r.uuid === resource.uuid)) {
      this._resources.push(resource);

      this._lifecycle = {
        ...this._lifecycle,
        updatedAt: new Date(),
        version: this._lifecycle.version + 1,
      };
    }
  }

  /**
   * 移除资源
   */
  removeResource(resourceUuid: string): void {
    const index = this._resources.findIndex((r) => r.uuid === resourceUuid);
    if (index !== -1) {
      this._resources.splice(index, 1);

      this._lifecycle = {
        ...this._lifecycle,
        updatedAt: new Date(),
        version: this._lifecycle.version + 1,
      };
    }
  }

  /**
   * 获取特定版本
   */
  getVersion(versionNumber: number): DocumentVersion | undefined {
    return this._versions.find((v) => v.versionNumber === versionNumber);
  }

  /**
   * 获取最新版本
   */
  getLatestVersion(): DocumentVersion | undefined {
    return this._versions[this._versions.length - 1];
  }

  /**
   * 检查文档是否已修改
   */
  isDirty(): boolean {
    const latestVersion = this.getLatestVersion();
    return !latestVersion || latestVersion.content !== this._content;
  }

  /**
   * 获取领域事件
   */
  getDomainEvents(): any[] {
    return [...this._domainEvents];
  }

  /**
   * 清除领域事件
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // 私有辅助方法
  private addDomainEvent(event: any): void {
    this._domainEvents.push({
      ...event,
      eventId: this.generateEventId(),
      aggregateType: 'Document',
      occurredOn: new Date(),
      eventVersion: 1,
    });
  }

  private generateVersionUuid(): string {
    return `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private countWords(content: string): number {
    return content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private extractTableOfContents(): TableOfContents {
    // 简单的标题提取实现
    const lines = this._content.split('\n');
    const tocItems: TocItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/^(#{1,6})\s+(.+)$/);

      if (match) {
        const level = match[1].length;
        const title = match[2];
        const anchor = title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '');

        tocItems.push({
          level,
          title,
          anchor,
          children: [],
        });
      }
    }

    return { items: tocItems };
  }

  private convertToHtml(): string {
    // 简单的 Markdown 到 HTML 转换
    // 在实际实现中，这里会使用专门的 Markdown 解析器
    return this._content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>');
  }

  equals(other: Document): boolean {
    return this.uuid === other.uuid;
  }

  toString(): string {
    return `Document(${this.uuid}, ${this._title}, ${this._format})`;
  }

  /**
   * 创建新文档
   */
  static create(
    uuid: string,
    repositoryUuid: string,
    relativePath: string,
    fileName: string,
    title: string,
    format: DocumentFormat,
    content: string = '',
  ): Document {
    const now = new Date();
    const metadata = DocumentMetadata.createDefault().updateStats(
      content
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
      content.length,
    );

    const defaultRenderingState: RenderingState = {
      mode: RenderingMode.SOURCE_ONLY,
      isLivePreview: false,
      cursorInRenderedView: false,
      renderedContent: {
        html: '',
        toc: { items: [] },
        codeBlocks: [],
        mathBlocks: [],
        imageReferences: [],
      },
      sourceMap: { mappings: [] },
    };

    const lifecycle: EntityLifecycle = {
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    const document = new Document(
      uuid,
      repositoryUuid,
      relativePath,
      fileName,
      title,
      content,
      format,
      metadata,
      [],
      [],
      [],
      defaultRenderingState,
      lifecycle,
    );

    document.addDomainEvent({
      eventType: 'DocumentCreated',
      aggregateId: uuid,
      eventData: {
        documentUuid: uuid,
        repositoryUuid,
        title,
        relativePath,
        format,
      },
    });

    return document;
  }

  /**
   * 从接口创建
   */
  static from(doc: IDocument): Document {
    return new Document(
      doc.uuid,
      doc.repositoryUuid,
      doc.relativePath,
      doc.fileName,
      doc.title,
      doc.content,
      doc.format,
      DocumentMetadata.from(doc.metadata),
      [...doc.tags],
      [...doc.resources],
      doc.versions.map(
        (v) =>
          new DocumentVersion(
            v.uuid,
            v.documentUuid,
            v.versionNumber,
            v.content,
            v.changeSet.map((c) => ContentChange.from(c)),
            v.author,
            v.createdAt,
            v.description,
          ),
      ),
      doc.renderingState,
      doc.lifecycle,
    );
  }
}
