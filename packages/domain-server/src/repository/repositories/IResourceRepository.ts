/**
 * IResourceRepository - 资源实体的存储接口
 * 定义资源相关的数据访问操作
 */

import { RepositoryContracts } from '@dailyuse/contracts';

// 使用 RepositoryContracts 的类型定义
type ResourceDTO = RepositoryContracts.ResourceDTO;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;
type IResourceMetadata = RepositoryContracts.IResourceMetadata;

export interface IResourceRepository {
  // ============ 基础CRUD操作 ============

  /**
   * 根据UUID查找资源
   */
  findByUuid(uuid: string): Promise<ResourceDTO | null>;

  /**
   * 根据仓库UUID查找所有资源
   */
  findByRepositoryUuid(repositoryUuid: string): Promise<ResourceDTO[]>;

  /**
   * 根据路径查找资源
   */
  findByPath(repositoryUuid: string, path: string): Promise<ResourceDTO | null>;

  /**
   * 保存资源
   */
  save(resource: ResourceDTO): Promise<void>;

  /**
   * 删除资源
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查资源是否存在
   */
  exists(uuid: string): Promise<boolean>;

  // ============ 查询操作 ============

  /**
   * 分页查询资源
   */
  findWithPagination(params: {
    repositoryUuid: string;
    page: number;
    limit: number;
    type?: ResourceType;
    status?: ResourceStatus;
    searchTerm?: string;
    tags?: string[];
  }): Promise<{
    resources: ResourceDTO[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * 根据类型查找资源
   */
  findByType(repositoryUuid: string, type: ResourceType): Promise<ResourceDTO[]>;

  /**
   * 根据状态查找资源
   */
  findByStatus(repositoryUuid: string, status: ResourceStatus): Promise<ResourceDTO[]>;

  /**
   * 根据标签查找资源
   */
  findByTags(repositoryUuid: string, tags: string[]): Promise<ResourceDTO[]>;

  /**
   * 根据名称模糊查询
   */
  findByNamePattern(repositoryUuid: string, namePattern: string): Promise<ResourceDTO[]>;

  /**
   * 查找父资源下的子资源
   */
  findByParent(parentResourceUuid: string): Promise<ResourceDTO[]>;

  /**
   * 查找最近访问的资源
   */
  findRecentlyAccessed(repositoryUuid: string, limit: number): Promise<ResourceDTO[]>;

  /**
   * 查找最近修改的资源
   */
  findRecentlyModified(repositoryUuid: string, limit: number): Promise<ResourceDTO[]>;

  /**
   * 查找收藏的资源
   */
  findFavorites(repositoryUuid: string): Promise<ResourceDTO[]>;

  // ============ 内容搜索 ============

  /**
   * 全文搜索资源内容
   */
  searchContent(repositoryUuid: string, searchTerm: string): Promise<ResourceDTO[]>;

  /**
   * 根据作者查找资源
   */
  findByAuthor(repositoryUuid: string, author: string): Promise<ResourceDTO[]>;

  /**
   * 根据分类查找资源
   */
  findByCategory(repositoryUuid: string, category: string): Promise<ResourceDTO[]>;

  /**
   * 查找特定大小范围的资源
   */
  findBySizeRange(
    repositoryUuid: string,
    minSize: number,
    maxSize?: number,
  ): Promise<ResourceDTO[]>;

  /**
   * 查找特定时间范围内创建的资源
   */
  findByCreatedDateRange(
    repositoryUuid: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<ResourceDTO[]>;

  /**
   * 查找特定时间范围内修改的资源
   */
  findByModifiedDateRange(
    repositoryUuid: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<ResourceDTO[]>;

  // ============ 统计操作 ============

  /**
   * 获取仓库的资源统计信息
   */
  getRepositoryStats(repositoryUuid: string): Promise<{
    totalResources: number;
    resourcesByType: Record<ResourceType, number>;
    resourcesByStatus: Record<ResourceStatus, number>;
    totalSize: number;
    averageSize: number;
    recentActiveCount: number;
    favoriteCount: number;
  }>;

  /**
   * 获取资源类型分布
   */
  getTypeDistribution(repositoryUuid: string): Promise<Record<ResourceType, number>>;

  /**
   * 获取标签使用统计
   */
  getTagStats(repositoryUuid: string): Promise<
    Array<{
      tag: string;
      count: number;
    }>
  >;

  /**
   * 获取作者活跃度统计
   */
  getAuthorStats(repositoryUuid: string): Promise<
    Array<{
      author: string;
      resourceCount: number;
      lastActivity: Date;
    }>
  >;

  // ============ 批量操作 ============

  /**
   * 批量保存资源
   */
  saveMany(resources: ResourceDTO[]): Promise<void>;

  /**
   * 批量删除资源
   */
  deleteMany(uuids: string[]): Promise<void>;

  /**
   * 批量更新资源状态
   */
  updateStatusBatch(uuids: string[], status: ResourceStatus): Promise<void>;

  /**
   * 批量添加标签
   */
  addTagsBatch(uuids: string[], tags: string[]): Promise<void>;

  /**
   * 批量移除标签
   */
  removeTagsBatch(uuids: string[], tags: string[]): Promise<void>;

  /**
   * 批量更新分类
   */
  updateCategoryBatch(uuids: string[], category: string): Promise<void>;

  // ============ 关系操作 ============

  /**
   * 建立资源父子关系
   */
  setParentChild(childUuid: string, parentUuid: string): Promise<void>;

  /**
   * 移除资源父子关系
   */
  removeParentChild(childUuid: string): Promise<void>;

  /**
   * 获取资源的所有子资源（递归）
   */
  getDescendants(parentUuid: string): Promise<ResourceDTO[]>;

  /**
   * 获取资源的祖先路径
   */
  getAncestorPath(resourceUuid: string): Promise<ResourceDTO[]>;

  // ============ 维护操作 ============

  /**
   * 清理已删除的资源
   */
  cleanupDeleted(repositoryUuid: string, olderThanDays: number): Promise<number>;

  /**
   * 更新资源访问记录
   */
  updateAccessRecord(uuid: string, accessedAt: Date): Promise<void>;

  /**
   * 重建资源索引
   */
  rebuildIndex(repositoryUuid: string): Promise<void>;

  /**
   * 检查并修复资源完整性
   */
  checkIntegrity(repositoryUuid: string): Promise<{
    checkedCount: number;
    brokenCount: number;
    brokenResources: string[];
  }>;

  /**
   * 同步文件系统状态
   */
  syncFileSystem(repositoryUuid: string): Promise<{
    addedCount: number;
    modifiedCount: number;
    deletedCount: number;
  }>;

  // ============ 高级查询 ============

  /**
   * 查找重复内容的资源（基于checksum）
   */
  findDuplicates(repositoryUuid: string): Promise<
    Array<{
      checksum: string;
      resources: ResourceDTO[];
    }>
  >;

  /**
   * 查找孤立资源（没有被引用的资源）
   */
  findOrphaned(repositoryUuid: string): Promise<ResourceDTO[]>;

  /**
   * 查找大文件资源
   */
  findLargeFiles(repositoryUuid: string, sizeThreshold: number): Promise<ResourceDTO[]>;

  /**
   * 查找长期未访问的资源
   */
  findStaleResources(repositoryUuid: string, daysThreshold: number): Promise<ResourceDTO[]>;

  /**
   * 根据元数据查询
   */
  findByMetadata(
    repositoryUuid: string,
    metadataQuery: Partial<IResourceMetadata>,
  ): Promise<ResourceDTO[]>;
}
