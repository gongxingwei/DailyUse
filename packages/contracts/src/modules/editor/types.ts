/**
 * Editor Module Types - DDD Architecture
 * 编辑器模块类型定义 - 领域驱动设计架构
 */

// ===== 基础共享类型 =====

export interface EntityLifecycle {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;
}

// ===== 枚举定义 =====

export enum DocumentFormat {
  MARKDOWN = 'markdown',
  PLAINTEXT = 'plaintext',
  HTML = 'html',
  JSON = 'json',
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
}

export enum SupportedFileType {
  MARKDOWN = 'markdown',
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  JSON = 'json',
  HTML = 'html',
  CSS = 'css',
  SCSS = 'scss',
  LESS = 'less',
  YAML = 'yaml',
  TOML = 'toml',
  XML = 'xml',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  CPP = 'cpp',
  C = 'c',
  GO = 'go',
  RUST = 'rust',
  PHP = 'php',
  RUBY = 'ruby',
  SHELL = 'shell',
  POWERSHELL = 'powershell',
  SQL = 'sql',
  PLAINTEXT = 'plaintext',
  TEXT = 'text',
  LOG = 'log',
  DOCKERFILE = 'dockerfile',
  GITIGNORE = 'gitignore',
  README = 'readme',
  LICENSE = 'license',
  CONFIG = 'config',
  UNKNOWN = 'unknown',
}

export enum FileOperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  RENAME = 'rename',
  MOVE = 'move',
  COPY = 'copy',
  SAVE = 'save',
  RESTORE = 'restore',
  BACKUP = 'backup',
}

export enum RenderingMode {
  SOURCE_ONLY = 'source',
  PREVIEW_ONLY = 'preview',
  SPLIT_VIEW = 'split',
  WYSIWYG = 'wysiwyg',
}

export enum ViewMode {
  EDITOR_ONLY = 'editor',
  PREVIEW_ONLY = 'preview',
  SPLIT_HORIZONTAL = 'split-h',
  SPLIT_VERTICAL = 'split-v',
  TYPORA_MODE = 'typora',
}

export enum SidebarTab {
  FILE_EXPLORER = 'files',
  TAG_BROWSER = 'tags',
  SEARCH = 'search',
  OUTLINE = 'outline',
  RESOURCES = 'resources',
}

export enum SearchType {
  FULL_TEXT = 'fulltext',
  REGEX = 'regex',
  TAG = 'tag',
  FILE_NAME = 'filename',
}

export enum ResourceType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
}

export enum ChangeType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
}

export enum SelectionDirection {
  FORWARD = 'forward',
  BACKWARD = 'backward',
}

// ===== 值对象接口 =====

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface TextSelection {
  start: Position;
  end: Position;
  direction: SelectionDirection;
}

export interface CursorPosition {
  position: Position;
  isActive: boolean;
  blinkState: boolean;
}

export interface EditorTheme {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  accent: string;
  border: string;
  selection: string;
  lineNumber: string;
  [key: string]: string;
}

export interface AutoSaveSettings {
  enabled: boolean;
  interval: number;
  onFocusLoss: boolean;
}

export interface SyntaxSettings {
  highlightEnabled: boolean;
  language: string;
  markdownPreview: boolean;
  livePreview: boolean;
}

export interface EditorSettings {
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

export interface DocumentMetadata {
  tags: string[];
  category: string;
  wordCount: number;
  characterCount: number;
  readingTime: number;
  lastSavedAt?: number;
  isReadOnly: boolean;
  encoding: string;
  language: string;
}

export interface LinkedResource {
  uuid: string;
  type: ResourceType;
  relativePath: string;
  size: number;
  mimeType: string;
  thumbnailPath?: string;
}

// ===== 实体接口 =====

export interface IContentChange {
  uuid: string;
  type: ChangeType;
  position: Position;
  length: number;
  oldText: string;
  newText: string;
  timestamp: number;
}

export interface IDocumentVersion {
  uuid: string;
  documentUuid: string;
  versionNumber: number;
  content: string;
  changeSet: IContentChange[];
  author: string;
  createdAt: number;
  description?: string;
}

export interface FileTreeNode {
  uuid: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  tags: string[];
  children?: FileTreeNode[];
  metadata?: FileMetadata;
  isExpanded: boolean;
  isSelected: boolean;
}

export interface FileMetadata {
  createdAt: number;
  modifiedAt: number;
  size: number;
  permissions: string;
  mimeType?: string;
}

// ===== 复杂值对象 =====

export interface RenderingState {
  mode: RenderingMode;
  isLivePreview: boolean;
  cursorInRenderedView: boolean;
  renderedContent: RenderedContent;
  sourceMap: SourceMap;
}

export interface RenderedContent {
  html: string;
  toc: TableOfContents;
  codeBlocks: CodeBlock[];
  mathBlocks: MathBlock[];
  imageReferences: ImageReference[];
}

export interface SourceMap {
  mappings: SourceMapping[];
}

export interface SourceMapping {
  sourceStart: Position;
  sourceEnd: Position;
  renderedStart: Position;
  renderedEnd: Position;
  elementType: string;
}

export interface TableOfContents {
  items: TocItem[];
}

export interface TocItem {
  level: number;
  title: string;
  anchor: string;
  children: TocItem[];
}

export interface CodeBlock {
  uuid: string;
  language: string;
  code: string;
  startLine: number;
  endLine: number;
}

export interface MathBlock {
  uuid: string;
  formula: string;
  isInline: boolean;
  startPosition: Position;
  endPosition: Position;
}

export interface ImageReference {
  uuid: string;
  src: string;
  alt: string;
  title?: string;
  position: Position;
}

export interface SidebarState {
  isVisible: boolean;
  width: number;
  activeTab: SidebarTab;
  tabs: SidebarTabConfig[];
}

export interface SidebarTabConfig {
  id: SidebarTab;
  title: string;
  icon: string;
  isEnabled: boolean;
  order: number;
}

export interface WorkspaceLayout {
  sidebarWidth: number;
  editorWidth: number;
  previewWidth: number;
  isPreviewVisible: boolean;
  panelSizes: PanelSizes;
  viewMode: ViewMode;
}

export interface PanelSizes {
  sidebar: number;
  editor: number;
  preview: number;
}

export interface SearchScope {
  includeContent: boolean;
  includeFileNames: boolean;
  includeTags: boolean;
  fileTypes: string[];
  directories: string[];
}

export interface SearchFilter {
  key: string;
  value: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
}

export interface SearchResult {
  uuid: string;
  fileUuid: string;
  fileName: string;
  filePath: string;
  matches: SearchMatch[];
  score: number;
}

export interface SearchMatch {
  line: number;
  column: number;
  length: number;
  context: string;
  highlightedContext: string;
}

// ===== 聚合根接口 =====

export interface IDocument {
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

export interface OpenDocument {
  documentUuid: string;
  tabTitle: string;
  isDirty: boolean;
  lastActiveAt: number;
  cursorPosition: Position;
  scrollPosition: ScrollPosition;
}

export interface IEditorWorkspace {
  uuid: string;
  name: string;
  repositoryUuid: string;
  currentDocumentUuid?: string;
  openDocuments: OpenDocument[];
  sidebarState: SidebarState;
  layout: WorkspaceLayout;
  settings: EditorSettings;
  searchState: SearchState;
  lifecycle: EntityLifecycle;
}

export interface SearchState {
  currentQuery: string;
  searchType: SearchType;
  isSearching: boolean;
  results: SearchResult[];
  selectedResultIndex: number;
}

export interface IRepositoryExplorer {
  uuid: string;
  repositoryUuid: string;
  rootPath: string;
  fileTree: FileTreeNode[];
  filteredTree: FileTreeNode[];
  expandedNodes: string[];
  selectedNodes: string[];
  lastScanAt: number;
}

export interface ISearchQuery {
  uuid: string;
  query: string;
  type: SearchType;
  scope: SearchScope;
  filters: SearchFilter[];
  results: SearchResult[];
  executedAt: number;
}

export interface SavedSearch {
  uuid: string;
  name: string;
  query: ISearchQuery;
  createdAt: number;
}

export interface SearchIndexState {
  isBuilding: boolean;
  lastBuiltAt: number;
  indexedFileCount: number;
  totalFileCount: number;
}

export interface ISearchEngine {
  uuid: string;
  workspaceUuid: string;
  searchHistory: ISearchQuery[];
  savedSearches: SavedSearch[];
  indexState: SearchIndexState;
}

// ===== 辅助类型 =====

export interface RepositoryContent {
  uuid: string;
  name: string;
  rootPath: string;
  fileTree: FileTreeNode[];
  totalFiles: number;
  totalSize: number;
  lastScanAt: number;
}

export interface TagInfo {
  name: string;
  count: number;
  color?: string;
  description?: string;
}

export interface SyncResult {
  success: boolean;
  addedFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  errors: string[];
}

export interface RepositoryInfo {
  uuid: string;
  name: string;
  path: string;
  description?: string;
  isActive: boolean;
}

// ===== 领域服务接口 =====

export interface IDocumentParser {
  parseMarkdown(content: string): Promise<ParsedDocument>;
  parseHtml(content: string): Promise<ParsedDocument>;
  convertToMarkdown(document: ParsedDocument): Promise<string>;
  convertToHtml(document: ParsedDocument): Promise<string>;
  extractMetadata(content: string, format: DocumentFormat): DocumentMetadata;
}

export interface ISyntaxHighlighter {
  highlight(code: string, language: string): HighlightedContent;
  getSupportedLanguages(): string[];
  getTheme(name: string): SyntaxTheme;
}

export interface IAutoComplete {
  getSuggestions(context: CompletionContext): CompletionSuggestion[];
  getSnippets(language: string): CodeSnippet[];
}

export interface IRepositoryIntegrationService {
  loadRepositoryContent(repositoryUuid: string): Promise<RepositoryContent>;
  syncWithRepository(workspaceUuid: string): Promise<SyncResult>;
  watchRepositoryChanges(repositoryUuid: string): Promise<void>;
  getTagsFromRepository(repositoryUuid: string): Promise<TagInfo[]>;
  searchByTags(repositoryUuid: string, tags: string[]): Promise<FileTreeNode[]>;
  resolveResourcePath(relativePath: string, repositoryUuid: string): Promise<string>;
  generateThumbnail(resourceUuid: string): Promise<string>;
}

export interface IWysiwygRenderer {
  renderToWysiwyg(content: string, format: DocumentFormat): Promise<RenderedContent>;
  parseWysiwygToSource(renderedContent: RenderedContent): Promise<string>;
  handleInlineEdit(element: HTMLElement, newContent: string): Promise<SourceChange>;
  mapCursorPosition(
    position: Position,
    fromMode: RenderingMode,
    toMode: RenderingMode,
  ): Promise<Position>;
  registerRenderer(format: DocumentFormat, renderer: CustomRenderer): void;
  getAvailableThemes(): RenderingTheme[];
}

export interface ISearchService {
  searchFullText(query: string, scope: SearchScope): Promise<SearchResult[]>;
  searchRegex(pattern: string, flags: string, scope: SearchScope): Promise<SearchResult[]>;
  searchByTags(tags: string[], operator: 'AND' | 'OR'): Promise<SearchResult[]>;
  searchFileNames(pattern: string, isRegex: boolean): Promise<SearchResult[]>;
  buildSearchIndex(repositoryUuid: string): Promise<void>;
  updateSearchIndex(changedFiles: string[]): Promise<void>;
}

// ===== 扩展类型 =====

export interface CustomRenderer {
  format: DocumentFormat;
  render: (content: string) => Promise<string>;
  parse: (rendered: string) => Promise<string>;
}

export interface RenderingTheme {
  name: string;
  css: string;
  isDark: boolean;
}

export interface CompletionContext {
  content: string;
  position: Position;
  language: string;
  triggerCharacter?: string;
}

export interface CompletionSuggestion {
  label: string;
  insertText: string;
  detail?: string;
  documentation?: string;
  kind:
    | 'text'
    | 'method'
    | 'function'
    | 'constructor'
    | 'field'
    | 'variable'
    | 'class'
    | 'interface'
    | 'module'
    | 'property'
    | 'unit'
    | 'value'
    | 'enum'
    | 'keyword'
    | 'snippet'
    | 'color'
    | 'file'
    | 'reference';
}

export interface CodeSnippet {
  name: string;
  prefix: string;
  body: string[];
  description: string;
  scope: string;
}

export interface HighlightedContent {
  html: string;
  tokens: SyntaxToken[];
}

export interface SyntaxToken {
  type: string;
  content: string;
  startPosition: Position;
  endPosition: Position;
}

export interface SyntaxTheme {
  name: string;
  colors: { [tokenType: string]: string };
}

export interface ParsedDocument {
  content: string;
  metadata: DocumentMetadata;
  structure: DocumentStructure;
}

export interface DocumentStructure {
  headings: HeadingInfo[];
  links: LinkInfo[];
  images: ImageInfo[];
  codeBlocks: CodeBlockInfo[];
}

export interface HeadingInfo {
  level: number;
  text: string;
  anchor: string;
  position: Position;
}

export interface LinkInfo {
  text: string;
  url: string;
  title?: string;
  position: Position;
}

export interface ImageInfo {
  src: string;
  alt: string;
  title?: string;
  position: Position;
}

export interface CodeBlockInfo {
  language: string;
  code: string;
  startLine: number;
  endLine: number;
}

export interface SourceChange {
  changes: IContentChange[];
  newContent: string;
  affectedRange: TextSelection;
}

// ===== DTOs (数据传输对象) =====

export interface CreateDocumentDTO {
  repositoryUuid: string;
  title: string;
  relativePath: string;
  format: DocumentFormat;
  content?: string;
  tags?: string[];
  metadata?: Partial<DocumentMetadata>;
}

export interface UpdateDocumentDTO {
  title?: string;
  content?: string;
  tags?: string[];
  metadata?: Partial<DocumentMetadata>;
}

export interface CreateWorkspaceDTO {
  name: string;
  repositoryUuid: string;
  settings?: Partial<EditorSettings>;
}

export interface UpdateWorkspaceDTO {
  name?: string;
  settings?: Partial<EditorSettings>;
  layout?: Partial<WorkspaceLayout>;
  sidebarState?: Partial<SidebarState>;
}

export interface CreateSearchQueryDTO {
  query: string;
  type: SearchType;
  scope?: SearchScope;
  filters?: SearchFilter[];
}

export interface SaveSearchDTO {
  name: string;
  queryUuid: string;
}

export interface DocumentSummaryDTO {
  uuid: string;
  title: string;
  relativePath: string;
  format: DocumentFormat;
  tags: string[];
  wordCount: number;
  lastModified: number;
  isReadOnly: boolean;
}

export interface WorkspaceSummaryDTO {
  uuid: string;
  name: string;
  repositoryUuid: string;
  documentCount: number;
  lastAccessed: number;
  isActive: boolean;
}

export interface SearchResultDTO {
  queryUuid: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  hasMore: boolean;
}

// ===== 领域事件 =====

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: any;
  occurredOn: Date;
  eventVersion: number;
}

export interface DocumentCreatedEvent extends DomainEvent {
  eventType: 'DocumentCreated';
  eventData: {
    documentUuid: string;
    repositoryUuid: string;
    title: string;
    relativePath: string;
    format: DocumentFormat;
  };
}

export interface DocumentUpdatedEvent extends DomainEvent {
  eventType: 'DocumentUpdated';
  eventData: {
    documentUuid: string;
    changes: IContentChange[];
    newWordCount?: number;
    updatedTags?: string[];
  };
}

export interface DocumentDeletedEvent extends DomainEvent {
  eventType: 'DocumentDeleted';
  eventData: {
    documentUuid: string;
    repositoryUuid: string;
    relativePath: string;
  };
}

export interface WorkspaceCreatedEvent extends DomainEvent {
  eventType: 'WorkspaceCreated';
  eventData: {
    workspaceUuid: string;
    name: string;
    repositoryUuid: string;
  };
}

export interface WorkspaceActivatedEvent extends DomainEvent {
  eventType: 'WorkspaceActivated';
  eventData: {
    workspaceUuid: string;
    previousActiveWorkspaceUuid?: string;
  };
}

export interface DocumentOpenedEvent extends DomainEvent {
  eventType: 'DocumentOpened';
  eventData: {
    workspaceUuid: string;
    documentUuid: string;
    tabTitle: string;
  };
}

export interface SearchPerformedEvent extends DomainEvent {
  eventType: 'SearchPerformed';
  eventData: {
    searchEngineUuid: string;
    query: ISearchQuery;
    resultCount: number;
    searchTime: number;
  };
}

// ===== 仓储接口 =====

export interface IDocumentRepository {
  getById(uuid: string): Promise<IDocument | null>;
  getByPath(repositoryUuid: string, relativePath: string): Promise<IDocument | null>;
  getByRepository(repositoryUuid: string): Promise<IDocument[]>;
  getByTags(repositoryUuid: string, tags: string[]): Promise<IDocument[]>;
  save(document: IDocument): Promise<void>;
  delete(uuid: string): Promise<void>;
  search(criteria: DocumentSearchCriteria): Promise<IDocument[]>;
}

export interface IWorkspaceRepository {
  getById(uuid: string): Promise<IEditorWorkspace | null>;
  getByRepository(repositoryUuid: string): Promise<IEditorWorkspace[]>;
  getActive(): Promise<IEditorWorkspace | null>;
  save(workspace: IEditorWorkspace): Promise<void>;
  delete(uuid: string): Promise<void>;
}

export interface IRepositoryExplorerRepository {
  getByRepository(repositoryUuid: string): Promise<IRepositoryExplorer | null>;
  save(explorer: IRepositoryExplorer): Promise<void>;
  delete(repositoryUuid: string): Promise<void>;
}

export interface ISearchEngineRepository {
  getByWorkspace(workspaceUuid: string): Promise<ISearchEngine | null>;
  save(searchEngine: ISearchEngine): Promise<void>;
  delete(workspaceUuid: string): Promise<void>;
}

export interface DocumentSearchCriteria {
  repositoryUuid?: string;
  formats?: DocumentFormat[];
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  textContains?: string;
  titleContains?: string;
  limit?: number;
  offset?: number;
}

// ===== 应用服务接口 =====

export interface IDocumentApplicationService {
  createDocument(command: CreateDocumentDTO): Promise<string>;
  updateDocument(uuid: string, command: UpdateDocumentDTO): Promise<void>;
  deleteDocument(uuid: string): Promise<void>;
  getDocument(uuid: string): Promise<IDocument | null>;
  getDocumentsByRepository(repositoryUuid: string): Promise<DocumentSummaryDTO[]>;
  searchDocuments(criteria: DocumentSearchCriteria): Promise<DocumentSummaryDTO[]>;
  exportDocument(uuid: string, format: DocumentFormat): Promise<string>;
  importDocument(filePath: string, repositoryUuid: string): Promise<string>;
  getDocumentContent(uuid: string): Promise<string>;
  updateDocumentContent(uuid: string, content: string, changes: IContentChange[]): Promise<void>;
  addTagsToDocument(uuid: string, tags: string[]): Promise<void>;
  removeTagsFromDocument(uuid: string, tags: string[]): Promise<void>;
}

export interface IWorkspaceApplicationService {
  createWorkspace(command: CreateWorkspaceDTO): Promise<string>;
  updateWorkspace(uuid: string, command: UpdateWorkspaceDTO): Promise<void>;
  deleteWorkspace(uuid: string): Promise<void>;
  getWorkspace(uuid: string): Promise<IEditorWorkspace | null>;
  getWorkspacesByRepository(repositoryUuid: string): Promise<WorkspaceSummaryDTO[]>;
  activateWorkspace(uuid: string): Promise<void>;
  openDocument(workspaceUuid: string, documentUuid: string): Promise<void>;
  closeDocument(workspaceUuid: string, documentUuid: string): Promise<void>;
  updateWorkspaceLayout(uuid: string, layout: Partial<WorkspaceLayout>): Promise<void>;
  updateSidebarState(uuid: string, sidebarState: Partial<SidebarState>): Promise<void>;
}

export interface ISearchApplicationService {
  performSearch(workspaceUuid: string, request: CreateSearchQueryDTO): Promise<SearchResultDTO>;
  saveSearch(workspaceUuid: string, command: SaveSearchDTO): Promise<void>;
  getSavedSearches(workspaceUuid: string): Promise<SavedSearch[]>;
  deleteSavedSearch(workspaceUuid: string, searchUuid: string): Promise<void>;
  getSearchHistory(workspaceUuid: string): Promise<ISearchQuery[]>;
  clearSearchHistory(workspaceUuid: string): Promise<void>;
  rebuildSearchIndex(repositoryUuid: string): Promise<void>;
  getSearchIndexState(repositoryUuid: string): Promise<SearchIndexState>;
}

export interface IRepositoryExplorerApplicationService {
  getExplorer(repositoryUuid: string): Promise<IRepositoryExplorer | null>;
  refreshExplorer(repositoryUuid: string): Promise<void>;
  expandNode(repositoryUuid: string, nodeUuid: string): Promise<void>;
  collapseNode(repositoryUuid: string, nodeUuid: string): Promise<void>;
  selectNode(repositoryUuid: string, nodeUuid: string, multiSelect?: boolean): Promise<void>;
  searchFiles(repositoryUuid: string, query: string): Promise<FileTreeNode[]>;
  getFilesByTags(repositoryUuid: string, tags: string[]): Promise<FileTreeNode[]>;
  updateFileMetadata(
    repositoryUuid: string,
    filePath: string,
    metadata: Partial<FileMetadata>,
  ): Promise<void>;
}

// ===== 错误类型 =====

export class EditorError extends Error {
  public readonly code: string;
  public readonly context?: any;

  constructor(message: string, code: string, context?: any) {
    super(message);
    this.name = 'EditorError';
    this.code = code;
    this.context = context;
  }
}

export class EditorGroupError extends EditorError {
  public readonly groupUuid: string;

  constructor(message: string, groupUuid: string, context?: any) {
    super(message, 'EDITOR_GROUP_ERROR', context);
    this.name = 'EditorGroupError';
    this.groupUuid = groupUuid;
  }
}

export class DocumentError extends EditorError {
  public readonly documentUuid: string;

  constructor(message: string, documentUuid: string, context?: any) {
    super(message, 'DOCUMENT_ERROR', context);
    this.name = 'DocumentError';
    this.documentUuid = documentUuid;
  }
}

export class WorkspaceError extends EditorError {
  public readonly workspaceUuid: string;

  constructor(message: string, workspaceUuid: string, context?: any) {
    super(message, 'WORKSPACE_ERROR', context);
    this.name = 'WorkspaceError';
    this.workspaceUuid = workspaceUuid;
  }
}

// ===== 命令接口 (临时兼容旧代码) =====

export interface IEditorTab {
  uuid: string;
  title: string;
  path: string;
  active: boolean;
  isDirty: boolean;
  fileType: SupportedFileType;
}

export interface IEditorGroup {
  uuid: string;
  title: string;
  activeTabId?: string;
  tabs: IEditorTab[];
}

export interface IEditorLayout {
  uuid: string;
  name: string;
  configuration: any;
}

export interface IOpenFileCommand {
  filePath: string;
  path: string; // 添加兼容性属性
  groupId?: string;
  activate?: boolean;
}

export interface ICloseTabCommand {
  tabId: string;
  groupId?: string; // 添加兼容性属性
  saveChanges?: boolean;
}

export interface ISplitEditorCommand {
  direction: 'horizontal' | 'vertical';
  sourceTabId?: string; // 改为可选，兼容旧代码
  sourceGroupId?: string; // 添加兼容性属性
  copyCurrentTab?: boolean; // 添加兼容性属性
}

export interface IResizeEditorCommand {
  groupId: string;
  width: number;
  height: number;
}
