/**
 * In-Memory Workspace Repository Implementation
 * 内存工作区仓储实现 - 用于开发和测试
 */

import { EditorContracts } from '@dailyuse/contracts';
import type { IWorkspaceRepository } from '../interfaces/IWorkspaceRepository';
import crypto from 'crypto';

function generateUuid(): string {
  return crypto.randomUUID();
}

export class InMemoryWorkspaceRepository implements IWorkspaceRepository {
  private workspaces: Map<string, EditorContracts.IEditorWorkspace> = new Map();
  private activeWorkspace: Map<string, string> = new Map(); // accountUuid -> workspaceUuid

  // ============ 基本CRUD操作 ============

  async create(
    accountUuid: string,
    workspaceData: Omit<EditorContracts.IEditorWorkspace, 'uuid' | 'lifecycle'>,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const uuid = generateUuid();
    const now = new Date();

    const workspace: EditorContracts.IEditorWorkspace = {
      uuid,
      ...workspaceData,
      lifecycle: {
        createdAt: now,
        updatedAt: now,
        version: 1,
      },
    };

    const key = `${accountUuid}:${uuid}`;
    this.workspaces.set(key, workspace);

    return workspace;
  }

  async findByUuid(
    accountUuid: string,
    workspaceUuid: string,
  ): Promise<EditorContracts.IEditorWorkspace | null> {
    const key = `${accountUuid}:${workspaceUuid}`;
    return this.workspaces.get(key) || null;
  }

  async update(
    accountUuid: string,
    workspaceUuid: string,
    updates: Partial<EditorContracts.IEditorWorkspace>,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const key = `${accountUuid}:${workspaceUuid}`;
    const existing = this.workspaces.get(key);

    if (!existing) {
      throw new Error('Workspace not found');
    }

    const updated: EditorContracts.IEditorWorkspace = {
      ...existing,
      ...updates,
      lifecycle: {
        ...existing.lifecycle,
        updatedAt: new Date(),
        version: existing.lifecycle.version + 1,
      },
    };

    this.workspaces.set(key, updated);
    return updated;
  }

  async delete(accountUuid: string, workspaceUuid: string): Promise<void> {
    const key = `${accountUuid}:${workspaceUuid}`;
    this.workspaces.delete(key);

    // 如果删除的是活跃工作区，清除记录
    if (this.activeWorkspace.get(accountUuid) === workspaceUuid) {
      this.activeWorkspace.delete(accountUuid);
    }
  }

  // ============ 查询操作 ============

  async findByAccount(
    accountUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<EditorContracts.IEditorWorkspace[]> {
    const results: EditorContracts.IEditorWorkspace[] = [];

    for (const [key, workspace] of this.workspaces.entries()) {
      if (key.startsWith(`${accountUuid}:`)) {
        results.push(workspace);
      }
    }

    // 排序
    const sortBy = options?.sortBy || 'updatedAt';
    const sortOrder = options?.sortOrder || 'desc';

    results.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortBy === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else {
        aVal = a.lifecycle[sortBy];
        bVal = b.lifecycle[sortBy];
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    // 分页
    const offset = options?.offset || 0;
    const limit = options?.limit;

    return limit ? results.slice(offset, offset + limit) : results.slice(offset);
  }

  async findByRepository(
    accountUuid: string,
    repositoryUuid: string,
  ): Promise<EditorContracts.IEditorWorkspace[]> {
    const results: EditorContracts.IEditorWorkspace[] = [];

    for (const [key, workspace] of this.workspaces.entries()) {
      if (key.startsWith(`${accountUuid}:`) && workspace.repositoryUuid === repositoryUuid) {
        results.push(workspace);
      }
    }

    return results;
  }

  async findActiveWorkspace(accountUuid: string): Promise<EditorContracts.IEditorWorkspace | null> {
    const activeWorkspaceUuid = this.activeWorkspace.get(accountUuid);
    if (!activeWorkspaceUuid) {
      return null;
    }

    return this.findByUuid(accountUuid, activeWorkspaceUuid);
  }

  async setActiveWorkspace(accountUuid: string, workspaceUuid: string): Promise<void> {
    // 验证工作区存在
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    this.activeWorkspace.set(accountUuid, workspaceUuid);
  }

  async findRecentlyUsed(
    accountUuid: string,
    limit?: number,
  ): Promise<EditorContracts.IEditorWorkspace[]> {
    const results: EditorContracts.IEditorWorkspace[] = [];

    for (const [key, workspace] of this.workspaces.entries()) {
      if (key.startsWith(`${accountUuid}:`)) {
        results.push(workspace);
      }
    }

    // 按更新时间排序
    results.sort((a, b) => b.lifecycle.updatedAt.getTime() - a.lifecycle.updatedAt.getTime());

    return limit ? results.slice(0, limit) : results;
  }

  // ============ 工作区状态管理 ============

  async addOpenDocument(
    accountUuid: string,
    workspaceUuid: string,
    openDocument: EditorContracts.OpenDocument,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const openDocuments = [...workspace.openDocuments];

    // 检查文档是否已经打开
    const existingIndex = openDocuments.findIndex(
      (doc) => doc.documentUuid === openDocument.documentUuid,
    );
    if (existingIndex >= 0) {
      // 更新现有文档
      openDocuments[existingIndex] = openDocument;
    } else {
      // 添加新文档
      openDocuments.push(openDocument);
    }

    return this.update(accountUuid, workspaceUuid, { openDocuments });
  }

  async removeOpenDocument(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const openDocuments = workspace.openDocuments.filter(
      (doc) => doc.documentUuid !== documentUuid,
    );
    const updates: Partial<EditorContracts.IEditorWorkspace> = { openDocuments };

    // 如果关闭的是当前文档，清除当前文档引用
    if (workspace.currentDocumentUuid === documentUuid) {
      updates.currentDocumentUuid =
        openDocuments.length > 0 ? openDocuments[0].documentUuid : undefined;
    }

    return this.update(accountUuid, workspaceUuid, updates);
  }

  async setCurrentDocument(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string | undefined,
  ): Promise<EditorContracts.IEditorWorkspace> {
    return this.update(accountUuid, workspaceUuid, { currentDocumentUuid: documentUuid });
  }

  async updateOpenDocument(
    accountUuid: string,
    workspaceUuid: string,
    documentUuid: string,
    updates: Partial<EditorContracts.OpenDocument>,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const openDocuments = workspace.openDocuments.map((doc) =>
      doc.documentUuid === documentUuid ? { ...doc, ...updates } : doc,
    );

    return this.update(accountUuid, workspaceUuid, { openDocuments });
  }

  // ============ 布局和设置管理 ============

  async updateLayout(
    accountUuid: string,
    workspaceUuid: string,
    layout: Partial<EditorContracts.WorkspaceLayout>,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const updatedLayout = { ...workspace.layout, ...layout };
    return this.update(accountUuid, workspaceUuid, { layout: updatedLayout });
  }

  async updateSettings(
    accountUuid: string,
    workspaceUuid: string,
    settings: Partial<EditorContracts.EditorSettings>,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const updatedSettings = { ...workspace.settings, ...settings };
    return this.update(accountUuid, workspaceUuid, { settings: updatedSettings });
  }

  async updateSidebarState(
    accountUuid: string,
    workspaceUuid: string,
    sidebarState: Partial<EditorContracts.SidebarState>,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const updatedSidebarState = { ...workspace.sidebarState, ...sidebarState };
    return this.update(accountUuid, workspaceUuid, { sidebarState: updatedSidebarState });
  }

  async updateSearchState(
    accountUuid: string,
    workspaceUuid: string,
    searchState: Partial<EditorContracts.SearchState>,
  ): Promise<EditorContracts.IEditorWorkspace> {
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const updatedSearchState = { ...workspace.searchState, ...searchState };
    return this.update(accountUuid, workspaceUuid, { searchState: updatedSearchState });
  }

  // ============ 统计操作 ============

  async getCount(accountUuid: string): Promise<number> {
    let count = 0;

    for (const [key] of this.workspaces.entries()) {
      if (key.startsWith(`${accountUuid}:`)) {
        count++;
      }
    }

    return count;
  }

  async getUsageStats(
    accountUuid: string,
    workspaceUuid: string,
  ): Promise<{
    totalDocuments: number;
    openDocuments: number;
    lastUsedAt: Date;
    totalUsageTime: number; // 毫秒
  }> {
    const workspace = await this.findByUuid(accountUuid, workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return {
      totalDocuments: 0, // 需要Document仓储协助计算
      openDocuments: workspace.openDocuments.length,
      lastUsedAt: workspace.lifecycle.updatedAt,
      totalUsageTime: 0, // 需要额外的使用时间追踪
    };
  }

  // ============ 批量操作 ============

  async updateMany(
    accountUuid: string,
    updates: Array<{
      workspaceUuid: string;
      data: Partial<EditorContracts.IEditorWorkspace>;
    }>,
  ): Promise<EditorContracts.IEditorWorkspace[]> {
    const results: EditorContracts.IEditorWorkspace[] = [];

    for (const { workspaceUuid, data } of updates) {
      const updated = await this.update(accountUuid, workspaceUuid, data);
      results.push(updated);
    }

    return results;
  }

  async cleanupInactive(accountUuid: string, daysInactive: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    let cleaned = 0;
    const toDelete: string[] = [];

    for (const [key, workspace] of this.workspaces.entries()) {
      if (key.startsWith(`${accountUuid}:`) && workspace.lifecycle.updatedAt < cutoffDate) {
        toDelete.push(workspace.uuid);
        cleaned++;
      }
    }

    for (const workspaceUuid of toDelete) {
      await this.delete(accountUuid, workspaceUuid);
    }

    return cleaned;
  }
}
