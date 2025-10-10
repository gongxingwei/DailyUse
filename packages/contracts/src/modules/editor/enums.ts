/**
 * Editor Module Enums
 * 编辑器模块枚举定义
 *
 * 注意：枚举定义放在独立文件中，因为枚举通常是通用的，
 * 可以在 Server、Client、Persistence 层之间共享
 */

// ============ 项目相关枚举 ============

/**
 * 项目类型枚举
 */
export enum ProjectType {
  MARKDOWN = 'markdown',
  CODE = 'code',
  MIXED = 'mixed',
  OTHER = 'other',
}

// ============ 文档相关枚举 ============

/**
 * 文档语言（格式）枚举
 */
export enum DocumentLanguage {
  MARKDOWN = 'markdown',
  PLAINTEXT = 'plaintext',
  HTML = 'html',
  JSON = 'json',
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  GO = 'go',
  RUST = 'rust',
  OTHER = 'other',
}

/**
 * 版本变更类型枚举
 */
export enum VersionChangeType {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  RENAME = 'rename',
  MOVE = 'move',
  MERGE = 'merge',
  RESTORE = 'restore',
}

// ============ 标签页相关枚举 ============

/**
 * 标签页类型枚举
 */
export enum TabType {
  DOCUMENT = 'document',
  PREVIEW = 'preview',
  DIFF = 'diff',
  SETTINGS = 'settings',
  SEARCH = 'search',
  WELCOME = 'welcome',
}

/**
 * 分割方向枚举
 */
export enum SplitDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

// ============ 搜索相关枚举 ============

/**
 * 索引状态枚举
 */
export enum IndexStatus {
  NOT_INDEXED = 'not_indexed',
  INDEXING = 'indexing',
  INDEXED = 'indexed',
  FAILED = 'failed',
  OUTDATED = 'outdated',
}

// ============ 链接相关枚举 ============

/**
 * 链接来源类型枚举
 */
export enum LinkedSourceType {
  MARKDOWN_LINK = 'markdown_link',
  MARKDOWN_IMAGE = 'markdown_image',
  HTML_ANCHOR = 'html_anchor',
  HTML_IMAGE = 'html_image',
  WIKI_LINK = 'wiki_link',
  REFERENCE = 'reference',
}

/**
 * 链接目标类型枚举
 */
export enum LinkedTargetType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  EXTERNAL_URL = 'external_url',
  ANCHOR = 'anchor',
}

// ============ 视图相关枚举 ============

/**
 * 视图模式枚举
 */
export enum ViewMode {
  EDITOR = 'editor',
  PREVIEW = 'preview',
  SPLIT_H = 'split_h',
  SPLIT_V = 'split_v',
}

/**
 * 侧边栏激活标签枚举
 */
export enum SidebarActiveTab {
  FILES = 'files',
  TAGS = 'tags',
  SEARCH = 'search',
  OUTLINE = 'outline',
  RESOURCES = 'resources',
}
