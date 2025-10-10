/**
 * SearchApplicationService
 * 搜索应用服务
 */

import type { ISearchEngineRepository } from '../repositories/ISearchEngineRepository';
import type { IDocumentRepository } from '../repositories/IDocumentRepository';
import type { IEditorWorkspaceRepository } from '../repositories/IEditorWorkspaceRepository';
import type { EditorContracts } from '@dailyuse/contracts';
import { SearchEngine } from '../entities/SearchEngine';

type CreateSearchEngineRequest = EditorContracts.CreateSearchEngineRequest;
type SearchEngineClientDTO = EditorContracts.SearchEngineClientDTO;

/**
 * Search 应用服务
 */
export class SearchApplicationService {
  constructor(
    private readonly searchEngineRepository: ISearchEngineRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly workspaceRepository: IEditorWorkspaceRepository,
  ) {}

  /**
   * 创建搜索引擎
   */
  async createSearchEngine(
    accountUuid: string,
    request: CreateSearchEngineRequest,
  ): Promise<SearchEngineClientDTO> {
    // 检查工作区是否存在
    const workspace = await this.workspaceRepository.findByUuid(request.workspaceUuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${request.workspaceUuid}`);
    }

    // 检查是否已有搜索引擎
    const exists = await this.searchEngineRepository.existsByWorkspaceUuid(request.workspaceUuid);
    if (exists) {
      throw new Error(`工作区已有搜索引擎: ${request.workspaceUuid}`);
    }

    // 创建搜索引擎
    const engine = SearchEngine.create({
      workspaceUuid: request.workspaceUuid,
      accountUuid,
      name: request.name,
      description: request.description ?? undefined,
      indexPath: request.indexPath,
    });

    await this.searchEngineRepository.save(engine);

    return engine.toClientDTO();
  }

  /**
   * 开始索引
   */
  async startIndexing(uuid: string): Promise<SearchEngineClientDTO> {
    const engine = await this.searchEngineRepository.findByUuid(uuid);
    if (!engine) {
      throw new Error(`搜索引擎不存在: ${uuid}`);
    }

    // 获取文档总数
    const totalCount = await this.documentRepository.countByWorkspaceUuid(engine.workspaceUuid);

    engine.startIndexing(totalCount);
    await this.searchEngineRepository.save(engine);

    return engine.toClientDTO();
  }

  /**
   * 更新索引进度
   */
  async updateProgress(
    uuid: string,
    indexedCount: number,
    totalCount: number,
  ): Promise<SearchEngineClientDTO> {
    const engine = await this.searchEngineRepository.findByUuid(uuid);
    if (!engine) {
      throw new Error(`搜索引擎不存在: ${uuid}`);
    }

    engine.updateProgress(indexedCount, totalCount);
    await this.searchEngineRepository.save(engine);

    return engine.toClientDTO();
  }

  /**
   * 完成索引
   */
  async completeIndexing(uuid: string): Promise<SearchEngineClientDTO> {
    const engine = await this.searchEngineRepository.findByUuid(uuid);
    if (!engine) {
      throw new Error(`搜索引擎不存在: ${uuid}`);
    }

    engine.completeIndexing();
    await this.searchEngineRepository.save(engine);

    return engine.toClientDTO();
  }

  /**
   * 取消索引
   */
  async cancelIndexing(uuid: string): Promise<SearchEngineClientDTO> {
    const engine = await this.searchEngineRepository.findByUuid(uuid);
    if (!engine) {
      throw new Error(`搜索引擎不存在: ${uuid}`);
    }

    engine.cancelIndexing();
    await this.searchEngineRepository.save(engine);

    return engine.toClientDTO();
  }

  /**
   * 重置索引
   */
  async resetIndex(uuid: string): Promise<SearchEngineClientDTO> {
    const engine = await this.searchEngineRepository.findByUuid(uuid);
    if (!engine) {
      throw new Error(`搜索引擎不存在: ${uuid}`);
    }

    engine.resetIndex();
    await this.searchEngineRepository.save(engine);

    // 标记所有文档索引过期
    const documents = await this.documentRepository.findByWorkspaceUuid(engine.workspaceUuid);
    for (const document of documents) {
      document.markIndexOutdated();
    }
    await this.documentRepository.saveBatch(documents);

    return engine.toClientDTO();
  }

  /**
   * 索引单个文档
   */
  async indexDocument(engineUuid: string, documentUuid: string): Promise<void> {
    const engine = await this.searchEngineRepository.findByUuid(engineUuid);
    if (!engine) {
      throw new Error(`搜索引擎不存在: ${engineUuid}`);
    }

    const document = await this.documentRepository.findByUuid(documentUuid);
    if (!document) {
      throw new Error(`文档不存在: ${documentUuid}`);
    }

    // 更新搜索引擎计数
    engine.indexDocument();
    await this.searchEngineRepository.save(engine);

    // 标记文档已索引
    document.markIndexed();
    await this.documentRepository.save(document);
  }

  /**
   * 获取搜索引擎
   */
  async getSearchEngine(uuid: string): Promise<SearchEngineClientDTO | null> {
    const engine = await this.searchEngineRepository.findByUuid(uuid);
    return engine ? engine.toClientDTO() : null;
  }

  /**
   * 根据工作区获取搜索引擎
   */
  async getSearchEngineByWorkspace(workspaceUuid: string): Promise<SearchEngineClientDTO | null> {
    const engine = await this.searchEngineRepository.findByWorkspaceUuid(workspaceUuid);
    return engine ? engine.toClientDTO() : null;
  }

  /**
   * 删除搜索引擎
   */
  async deleteSearchEngine(uuid: string): Promise<void> {
    const engine = await this.searchEngineRepository.findByUuid(uuid);
    if (!engine) {
      throw new Error(`搜索引擎不存在: ${uuid}`);
    }

    await this.searchEngineRepository.delete(uuid);
  }
}
