/**
 * Repository Module Enums
 * 仓储模块枚举定义
 *
 * 注意：枚举定义放在独立文件中，因为枚举通常是通用的，
 * 可以在 Server、Client、Persistence 层之间共享
 */

// ============ 资源相关枚举 ============

/**
 * 资源类型枚举
 */
export enum ResourceType {
  MARKDOWN = 'markdown',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  PDF = 'pdf',
  LINK = 'link',
  CODE = 'code',
  OTHER = 'other',
}

/**
 * 资源状态枚举
 */
export enum ResourceStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  DRAFT = 'draft',
}

// ============ 仓库相关枚举 ============

/**
 * 仓库状态枚举
 */
export enum RepositoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  SYNCING = 'syncing',
}

/**
 * 仓库类型枚举
 */
export enum RepositoryType {
  LOCAL = 'local',
  REMOTE = 'remote',
  SYNCHRONIZED = 'synchronized',
}

// ============ 引用相关枚举 ============

/**
 * 引用类型枚举
 */
export enum ReferenceType {
  LINK = 'link',
  EMBED = 'embed',
  RELATED = 'related',
  DEPENDENCY = 'dependency',
}

/**
 * 内容类型枚举
 */
export enum ContentType {
  ARTICLE = 'article',
  VIDEO = 'video',
  IMAGE = 'image',
  DOCUMENT = 'document',
  OTHER = 'other',
}
