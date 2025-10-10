/**
 * DocumentApplicationService
 * 文档应用服务
 */

import type { IDocumentRepository } from '../repositories/IDocumentRepository';
import type { IDocumentVersionRepository } from '../repositories/IDocumentVersionRepository';
import type { ILinkedResourceRepository } from '../repositories/ILinkedResourceRepository';
import type { IEditorWorkspaceRepository } from '../repositories/IEditorWorkspaceRepository';
import { EditorContracts } from '@dailyuse/contracts';
import { Document } from '../entities/Document';
import { DocumentVersion } from '../entities/DocumentVersion';
import { DocumentMetadata } from '../value-objects/DocumentMetadata';

type CreateDocumentRequest = EditorContracts.CreateDocumentRequest;
type UpdateDocumentRequest = EditorContracts.UpdateDocumentRequest;
type DocumentClientDTO = EditorContracts.DocumentClientDTO;

/**
 * Document 应用服务
 */
export class DocumentApplicationService {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly versionRepository: IDocumentVersionRepository,
    private readonly linkedResourceRepository: ILinkedResourceRepository,
    private readonly workspaceRepository: IEditorWorkspaceRepository,
  ) {}

  /**
   * 创建文档
   */
  async createDocument(
    accountUuid: string,
    workspaceUuid: string,
    request: CreateDocumentRequest,
  ): Promise<DocumentClientDTO> {
    // 检查工作区是否存在
    const workspace = await this.workspaceRepository.findByUuid(workspaceUuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${workspaceUuid}`);
    }

    // 检查路径是否已存在
    const existing = await this.documentRepository.findByPath(workspaceUuid, request.path);
    if (existing) {
      throw new Error(`文档路径已存在: ${request.path}`);
    }

    // 创建文档元数据
    const metadata = request.metadata
      ? DocumentMetadata.fromServerDTO({
          ...DocumentMetadata.createDefault().toServerDTO(),
          ...request.metadata,
        })
      : DocumentMetadata.createDefault();

    // 创建文档
    const document = Document.create({
      workspaceUuid,
      accountUuid,
      path: request.path,
      name: request.name,
      language: request.language,
      content: request.content,
      metadata,
    });

    // 保存
    await this.documentRepository.save(document);

    // 创建初始版本
    await this.createInitialVersion(document);

    return document.toClientDTO();
  }

  /**
   * 更新文档
   */
  async updateDocument(uuid: string, request: UpdateDocumentRequest): Promise<DocumentClientDTO> {
    const document = await this.documentRepository.findByUuid(uuid);
    if (!document) {
      throw new Error(`文档不存在: ${uuid}`);
    }

    // 更新内容
    if (request.content !== undefined) {
      // 简单的哈希计算
      const contentHash = Buffer.from(request.content).toString('base64').substring(0, 16);
      document.updateContent(request.content, contentHash);

      // 创建新版本
      await this.createDocumentVersion(document, EditorContracts.VersionChangeType.EDIT);
    }

    // 更新元数据
    if (request.metadata) {
      const currentMetadata = document.metadata;
      const metadata = DocumentMetadata.fromServerDTO({
        ...currentMetadata,
        ...request.metadata,
      });
      document.updateMetadata(metadata);
    }

    await this.documentRepository.save(document);

    return document.toClientDTO();
  }

  /**
   * 删除文档
   */
  async deleteDocument(uuid: string): Promise<void> {
    const document = await this.documentRepository.findByUuid(uuid);
    if (!document) {
      throw new Error(`文档不存在: ${uuid}`);
    }

    // 删除所有版本
    await this.versionRepository.deleteByDocumentUuid(uuid);

    // 删除所有链接资源
    await this.linkedResourceRepository.deleteBySourceDocumentUuid(uuid);
    await this.linkedResourceRepository.deleteByTargetDocumentUuid(uuid);

    // 删除文档
    await this.documentRepository.delete(uuid);
  }

  /**
   * 获取文档详情
   */
  async getDocument(uuid: string): Promise<DocumentClientDTO | null> {
    const document = await this.documentRepository.findByUuid(uuid);
    return document ? document.toClientDTO() : null;
  }

  /**
   * 获取工作区的所有文档
   */
  async listDocuments(workspaceUuid: string): Promise<DocumentClientDTO[]> {
    const documents = await this.documentRepository.findByWorkspaceUuid(workspaceUuid);
    return documents.map((d) => d.toClientDTO());
  }

  /**
   * 标记文档已索引
   */
  async markDocumentIndexed(uuid: string): Promise<void> {
    const document = await this.documentRepository.findByUuid(uuid);
    if (!document) {
      throw new Error(`文档不存在: ${uuid}`);
    }

    document.markIndexed();
    await this.documentRepository.save(document);
  }

  /**
   * 标记索引过期
   */
  async markIndexOutdated(uuid: string): Promise<void> {
    const document = await this.documentRepository.findByUuid(uuid);
    if (!document) {
      throw new Error(`文档不存在: ${uuid}`);
    }

    document.markIndexOutdated();
    await this.documentRepository.save(document);
  }

  /**
   * 获取需要索引的文档
   */
  async getDocumentsNeedingIndex(workspaceUuid: string): Promise<DocumentClientDTO[]> {
    const documents = await this.documentRepository.findDocumentsNeedingIndex(workspaceUuid);
    return documents.map((d) => d.toClientDTO());
  }

  /**
   * 创建初始版本
   */
  private async createInitialVersion(document: Document): Promise<void> {
    const version = DocumentVersion.create({
      documentUuid: document.uuid,
      workspaceUuid: document.workspaceUuid,
      accountUuid: document.accountUuid,
      versionNumber: 1,
      changeType: EditorContracts.VersionChangeType.CREATE,
      contentHash: document.contentHash,
      changeDescription: '初始版本',
    });

    await this.versionRepository.save(version);
  }

  /**
   * 创建文档版本
   */
  private async createDocumentVersion(
    document: Document,
    changeType: EditorContracts.VersionChangeType,
  ): Promise<void> {
    const latestVersion = await this.versionRepository.getLatestVersionNumber(document.uuid);
    const versionNumber = latestVersion + 1;

    const version = DocumentVersion.create({
      documentUuid: document.uuid,
      workspaceUuid: document.workspaceUuid,
      accountUuid: document.accountUuid,
      versionNumber,
      changeType,
      contentHash: document.contentHash,
    });

    await this.versionRepository.save(version);
  }
}
