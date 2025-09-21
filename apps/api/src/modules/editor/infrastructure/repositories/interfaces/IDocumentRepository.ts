/**
 * Document Repository Interface
 * 文档仓储接口 - 定义文档聚合根的数据访问契约
 */

import { EditorContracts } from '@dailyuse/contracts';

export interface IDocumentRepository {
  // ============ 基本CRUD操作 ============

  /**
   * 创建新文档
   */
  create(
    accountUuid: string,
    documentData: Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>,
  ): Promise<EditorContracts.IDocument>;

  /**
   * 根据UUID查找文档
   */
  findByUuid(accountUuid: string, documentUuid: string): Promise<EditorContracts.IDocument | null>;

  /**
   * 根据路径查找文档
   */
  findByPath(
    accountUuid: string,
    repositoryUuid: string,
    relativePath: string,
  ): Promise<EditorContracts.IDocument | null>;

  /**
   * 更新文档
   */
  update(
    accountUuid: string,
    documentUuid: string,
    updates: Partial<EditorContracts.IDocument>,
  ): Promise<EditorContracts.IDocument>;

  /**
   * 删除文档
   */
  delete(accountUuid: string, documentUuid: string): Promise<void>;

  // ============ 查询操作 ============

  /**
   * 获取仓库中的所有文档
   */
  findByRepository(
    accountUuid: string,
    repositoryUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'title' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<EditorContracts.IDocument[]>;

  /**
   * 根据标签查找文档
   */
  findByTags(
    accountUuid: string,
    tags: string[],
    repositoryUuid?: string,
  ): Promise<EditorContracts.IDocument[]>;

  /**
   * 搜索文档内容
   */
  searchContent(
    accountUuid: string,
    query: string,
    options?: {
      repositoryUuid?: string;
      format?: EditorContracts.DocumentFormat;
      limit?: number;
    },
  ): Promise<EditorContracts.IDocument[]>;

  /**
   * 获取最近修改的文档
   */
  findRecentlyModified(
    accountUuid: string,
    limit?: number,
    repositoryUuid?: string,
  ): Promise<EditorContracts.IDocument[]>;

  // ============ 统计操作 ============

  /**
   * 获取文档总数
   */
  getCount(accountUuid: string, repositoryUuid?: string): Promise<number>;

  /**
   * 获取按格式分组的文档统计
   */
  getCountByFormat(accountUuid: string, repositoryUuid?: string): Promise<Record<string, number>>;

  // ============ 批量操作 ============

  /**
   * 批量创建文档
   */
  createMany(
    accountUuid: string,
    documents: Array<Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>>,
  ): Promise<EditorContracts.IDocument[]>;

  /**
   * 批量更新文档
   */
  updateMany(
    accountUuid: string,
    updates: Array<{
      documentUuid: string;
      data: Partial<EditorContracts.IDocument>;
    }>,
  ): Promise<EditorContracts.IDocument[]>;

  /**
   * 批量删除文档
   */
  deleteMany(accountUuid: string, documentUuids: string[]): Promise<void>;
}
