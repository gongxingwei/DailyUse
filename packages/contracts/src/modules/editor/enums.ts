/**
 * Editor 模块枚举定义
 */

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
