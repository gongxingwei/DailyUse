/**
 * In-Memory Document Repository Implementation
 * 内存文档仓储实现 - 用于开发和测试
 */

import { EditorContracts } from '@dailyuse/contracts';
import type { IDocumentRepository } from '../interfaces/IDocumentRepository';
import crypto from 'crypto';

function generateUuid(): string {
  return crypto.randomUUID();
}

export class InMemoryDocumentRepository implements IDocumentRepository {
  private documents: Map<string, EditorContracts.IDocument> = new Map();

  // ============ 基本CRUD操作 ============

  async create(
    accountUuid: string,
    documentData: Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>,
  ): Promise<EditorContracts.IDocument> {
    const uuid = generateUuid();
    const now = new Date();

    const document: EditorContracts.IDocument = {
      uuid,
      ...documentData,
      lifecycle: {
        createdAt: now,
        updatedAt: now,
        version: 1,
      },
    };

    const key = `${accountUuid}:${uuid}`;
    this.documents.set(key, document);

    return document;
  }

  async findByUuid(
    accountUuid: string,
    documentUuid: string,
  ): Promise<EditorContracts.IDocument | null> {
    const key = `${accountUuid}:${documentUuid}`;
    return this.documents.get(key) || null;
  }

  async findByPath(
    accountUuid: string,
    repositoryUuid: string,
    relativePath: string,
  ): Promise<EditorContracts.IDocument | null> {
    for (const [key, document] of this.documents.entries()) {
      if (
        key.startsWith(`${accountUuid}:`) &&
        document.repositoryUuid === repositoryUuid &&
        document.relativePath === relativePath
      ) {
        return document;
      }
    }
    return null;
  }

  async update(
    accountUuid: string,
    documentUuid: string,
    updates: Partial<EditorContracts.IDocument>,
  ): Promise<EditorContracts.IDocument> {
    const key = `${accountUuid}:${documentUuid}`;
    const existing = this.documents.get(key);

    if (!existing) {
      throw new Error('Document not found');
    }

    const updated: EditorContracts.IDocument = {
      ...existing,
      ...updates,
      lifecycle: {
        ...existing.lifecycle,
        updatedAt: new Date(),
        version: existing.lifecycle.version + 1,
      },
    };

    this.documents.set(key, updated);
    return updated;
  }

  async delete(accountUuid: string, documentUuid: string): Promise<void> {
    const key = `${accountUuid}:${documentUuid}`;
    this.documents.delete(key);
  }

  // ============ 查询操作 ============

  async findByRepository(
    accountUuid: string,
    repositoryUuid: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'title' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<EditorContracts.IDocument[]> {
    const results: EditorContracts.IDocument[] = [];

    for (const [key, document] of this.documents.entries()) {
      if (key.startsWith(`${accountUuid}:`) && document.repositoryUuid === repositoryUuid) {
        results.push(document);
      }
    }

    // 排序
    const sortBy = options?.sortBy || 'updatedAt';
    const sortOrder = options?.sortOrder || 'desc';

    results.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortBy === 'title') {
        aVal = a.title;
        bVal = b.title;
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

  async findByTags(
    accountUuid: string,
    tags: string[],
    repositoryUuid?: string,
  ): Promise<EditorContracts.IDocument[]> {
    const results: EditorContracts.IDocument[] = [];

    for (const [key, document] of this.documents.entries()) {
      if (
        key.startsWith(`${accountUuid}:`) &&
        (!repositoryUuid || document.repositoryUuid === repositoryUuid) &&
        tags.some((tag) => document.tags.includes(tag))
      ) {
        results.push(document);
      }
    }

    return results;
  }

  async searchContent(
    accountUuid: string,
    query: string,
    options?: {
      repositoryUuid?: string;
      format?: EditorContracts.DocumentFormat;
      limit?: number;
    },
  ): Promise<EditorContracts.IDocument[]> {
    const results: EditorContracts.IDocument[] = [];
    const searchQuery = query.toLowerCase();

    for (const [key, document] of this.documents.entries()) {
      if (
        key.startsWith(`${accountUuid}:`) &&
        (!options?.repositoryUuid || document.repositoryUuid === options.repositoryUuid) &&
        (!options?.format || document.format === options.format) &&
        (document.content.toLowerCase().includes(searchQuery) ||
          document.title.toLowerCase().includes(searchQuery))
      ) {
        results.push(document);
      }
    }

    return options?.limit ? results.slice(0, options.limit) : results;
  }

  async findRecentlyModified(
    accountUuid: string,
    limit?: number,
    repositoryUuid?: string,
  ): Promise<EditorContracts.IDocument[]> {
    const results: EditorContracts.IDocument[] = [];

    for (const [key, document] of this.documents.entries()) {
      if (
        key.startsWith(`${accountUuid}:`) &&
        (!repositoryUuid || document.repositoryUuid === repositoryUuid)
      ) {
        results.push(document);
      }
    }

    // 按更新时间排序
    results.sort((a, b) => b.lifecycle.updatedAt.getTime() - a.lifecycle.updatedAt.getTime());

    return limit ? results.slice(0, limit) : results;
  }

  // ============ 统计操作 ============

  async getCount(accountUuid: string, repositoryUuid?: string): Promise<number> {
    let count = 0;

    for (const [key, document] of this.documents.entries()) {
      if (
        key.startsWith(`${accountUuid}:`) &&
        (!repositoryUuid || document.repositoryUuid === repositoryUuid)
      ) {
        count++;
      }
    }

    return count;
  }

  async getCountByFormat(
    accountUuid: string,
    repositoryUuid?: string,
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    for (const [key, document] of this.documents.entries()) {
      if (
        key.startsWith(`${accountUuid}:`) &&
        (!repositoryUuid || document.repositoryUuid === repositoryUuid)
      ) {
        const format = document.format;
        counts[format] = (counts[format] || 0) + 1;
      }
    }

    return counts;
  }

  // ============ 批量操作 ============

  async createMany(
    accountUuid: string,
    documents: Array<Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>>,
  ): Promise<EditorContracts.IDocument[]> {
    const results: EditorContracts.IDocument[] = [];

    for (const documentData of documents) {
      const created = await this.create(accountUuid, documentData);
      results.push(created);
    }

    return results;
  }

  async updateMany(
    accountUuid: string,
    updates: Array<{
      documentUuid: string;
      data: Partial<EditorContracts.IDocument>;
    }>,
  ): Promise<EditorContracts.IDocument[]> {
    const results: EditorContracts.IDocument[] = [];

    for (const { documentUuid, data } of updates) {
      const updated = await this.update(accountUuid, documentUuid, data);
      results.push(updated);
    }

    return results;
  }

  async deleteMany(accountUuid: string, documentUuids: string[]): Promise<void> {
    for (const documentUuid of documentUuids) {
      await this.delete(accountUuid, documentUuid);
    }
  }
}
