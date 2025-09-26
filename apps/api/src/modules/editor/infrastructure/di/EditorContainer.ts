import { EditorDomainService } from '@dailyuse/domain-server';
import type { IDocumentRepository } from '../repositories/interfaces/IDocumentRepository';
import type { IWorkspaceRepository } from '../repositories/interfaces/IWorkspaceRepository';
import { InMemoryDocumentRepository } from '../repositories/memory/InMemoryDocumentRepository';
import { PrismaWorkspaceRepository } from '../repositories/prisma/PrismaWorkspaceRepository';
import { prisma } from '@/config/prisma';

export class EditorContainer {
  private static instance: EditorContainer;
  private editorDomainService?: EditorDomainService;
  private documentRepository?: IDocumentRepository;
  private workspaceRepository?: IWorkspaceRepository;

  private constructor() {}

  static getInstance(): EditorContainer {
    if (!EditorContainer.instance) {
      EditorContainer.instance = new EditorContainer();
    }
    return EditorContainer.instance;
  }

  /**
   * 获取 Editor 领域服务实例
   */
  async getEditorDomainService(): Promise<EditorDomainService> {
    if (!this.editorDomainService) {
      this.editorDomainService = new EditorDomainService();
    }
    return this.editorDomainService;
  }

  /**
   * 获取 Document 仓库实例 (使用内存实现)
   */
  async getDocumentRepository(): Promise<IDocumentRepository> {
    if (!this.documentRepository) {
      this.documentRepository = new InMemoryDocumentRepository();
    }
    return this.documentRepository;
  }

  /**
   * 获取 Workspace 仓库实例
   */
  async getWorkspaceRepository(): Promise<IWorkspaceRepository> {
    if (!this.workspaceRepository) {
      this.workspaceRepository = new PrismaWorkspaceRepository(prisma);
    }
    return this.workspaceRepository;
  }

  // 用于测试时替换实现
  setEditorDomainService(service: EditorDomainService): void {
    this.editorDomainService = service;
  }

  setDocumentRepository(repository: IDocumentRepository): void {
    this.documentRepository = repository;
  }

  setWorkspaceRepository(repository: IWorkspaceRepository): void {
    this.workspaceRepository = repository;
  }
}
