/**
 * Document Repository Implementation
 * 文档仓储实现
 */

// 临时类型定义
interface Document {
  uuid: string;
  repositoryUuid: string;
  title: string;
  content: string;
  format: string;
  version: number;
  createdAt: Date;
  lastModifiedAt: Date;
  lastSavedAt?: Date;
  metadata: DocumentMetadata;
  tags: string[];
  isDirty: boolean;
}

interface DocumentMetadata {
  wordCount: number;
  characterCount: number;
  lineCount: number;
  language?: string;
  encoding: string;
  checksumMd5: string;
  checksumSha256: string;
}

interface ContentChange {
  uuid: string;
  documentUuid: string;
  type: string;
  position: Position;
  length: number;
  oldText: string;
  newText: string;
  timestamp: number;
  userId: string;
}

interface Position {
  line: number;
  column: number;
  offset: number;
}

interface SearchQuery {
  query: string;
  searchType: string;
  repositoryUuid?: string;
  documentFormat?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    useRegex?: boolean;
    includeMetadata?: boolean;
  };
}

interface SearchResult {
  uuid: string;
  documentUuid: string;
  title: string;
  snippet: string;
  matches: SearchMatch[];
  score: number;
  rank: number;
}

interface SearchMatch {
  line: number;
  column: number;
  length: number;
  context: string;
  highlightText: string;
}

/**
 * 文档仓储实现
 */
export class DocumentRepository {
  private documents = new Map<string, Document>();
  private searchIndex = new Map<string, Set<string>>(); // word -> document uuids
  private contentChanges = new Map<string, ContentChange[]>(); // documentUuid -> changes

  constructor() {
    this.initializeSearchIndex();
  }

  /**
   * 创建文档
   */
  async create(document: Document): Promise<Document> {
    // 生成唯一ID
    if (!document.uuid) {
      document.uuid = this.generateUuid();
    }

    // 设置创建时间
    const now = new Date();
    document.createdAt = now;
    document.lastModifiedAt = now;
    document.version = 1;

    // 计算元数据
    document.metadata = this.calculateMetadata(document.content);

    // 保存文档
    this.documents.set(document.uuid, document);

    // 更新搜索索引
    this.updateSearchIndex(document);

    return { ...document };
  }

  /**
   * 通过UUID获取文档
   */
  async findByUuid(uuid: string): Promise<Document | null> {
    const document = this.documents.get(uuid);
    return document ? { ...document } : null;
  }

  /**
   * 通过仓储UUID获取文档列表
   */
  async findByRepositoryUuid(repositoryUuid: string): Promise<Document[]> {
    const documents = Array.from(this.documents.values()).filter(
      (doc) => doc.repositoryUuid === repositoryUuid,
    );

    return documents.map((doc) => ({ ...doc }));
  }

  /**
   * 更新文档
   */
  async update(uuid: string, updates: Partial<Document>): Promise<Document | null> {
    const document = this.documents.get(uuid);
    if (!document) return null;

    // 更新字段
    const updatedDocument: Document = {
      ...document,
      ...updates,
      uuid, // 确保UUID不被覆盖
      version: document.version + 1,
      lastModifiedAt: new Date(),
    };

    // 如果内容发生变化，重新计算元数据
    if (updates.content !== undefined) {
      updatedDocument.metadata = this.calculateMetadata(updates.content);
      updatedDocument.isDirty = true;
    }

    // 保存更新
    this.documents.set(uuid, updatedDocument);

    // 更新搜索索引
    this.updateSearchIndex(updatedDocument);

    return { ...updatedDocument };
  }

  /**
   * 更新文档内容
   */
  async updateContent(
    uuid: string,
    content: string,
    changes: ContentChange[],
  ): Promise<Document | null> {
    const document = this.documents.get(uuid);
    if (!document) return null;

    // 记录内容变更
    if (!this.contentChanges.has(uuid)) {
      this.contentChanges.set(uuid, []);
    }
    this.contentChanges.get(uuid)!.push(...changes);

    // 更新文档
    return this.update(uuid, { content });
  }

  /**
   * 标记文档为已保存
   */
  async markSaved(uuid: string): Promise<Document | null> {
    const document = this.documents.get(uuid);
    if (!document) return null;

    const updatedDocument: Document = {
      ...document,
      isDirty: false,
      lastSavedAt: new Date(),
    };

    this.documents.set(uuid, updatedDocument);
    return { ...updatedDocument };
  }

  /**
   * 删除文档
   */
  async delete(uuid: string): Promise<boolean> {
    const document = this.documents.get(uuid);
    if (!document) return false;

    // 删除文档
    this.documents.delete(uuid);

    // 删除搜索索引
    this.removeFromSearchIndex(document);

    // 删除变更历史
    this.contentChanges.delete(uuid);

    return true;
  }

  /**
   * 搜索文档
   */
  async search(searchQuery: SearchQuery): Promise<SearchResult[]> {
    const { query, searchType, repositoryUuid, options = {} } = searchQuery;

    if (!query.trim()) return [];

    let candidateDocuments = Array.from(this.documents.values());

    // 按仓储过滤
    if (repositoryUuid) {
      candidateDocuments = candidateDocuments.filter(
        (doc) => doc.repositoryUuid === repositoryUuid,
      );
    }

    // 按格式过滤
    if (searchQuery.documentFormat) {
      candidateDocuments = candidateDocuments.filter(
        (doc) => doc.format === searchQuery.documentFormat,
      );
    }

    // 按标签过滤
    if (searchQuery.tags && searchQuery.tags.length > 0) {
      candidateDocuments = candidateDocuments.filter((doc) =>
        searchQuery.tags!.some((tag) => doc.tags.includes(tag)),
      );
    }

    // 按日期范围过滤
    if (searchQuery.dateRange) {
      const { from, to } = searchQuery.dateRange;
      candidateDocuments = candidateDocuments.filter(
        (doc) => doc.lastModifiedAt >= from && doc.lastModifiedAt <= to,
      );
    }

    const results: SearchResult[] = [];

    for (const document of candidateDocuments) {
      const matches = this.findMatches(document, query, options);

      if (matches.length > 0) {
        const score = this.calculateScore(document, query, matches);

        results.push({
          uuid: this.generateUuid(),
          documentUuid: document.uuid,
          title: document.title,
          snippet: this.generateSnippet(document.content, matches[0]),
          matches,
          score,
          rank: 0, // 将在排序后设置
        });
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score);

    // 设置排名
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }

  /**
   * 获取文档变更历史
   */
  async getChangeHistory(documentUuid: string): Promise<ContentChange[]> {
    return this.contentChanges.get(documentUuid) || [];
  }

  /**
   * 获取所有文档
   */
  async findAll(): Promise<Document[]> {
    return Array.from(this.documents.values()).map((doc) => ({ ...doc }));
  }

  /**
   * 按标题搜索
   */
  async findByTitle(title: string): Promise<Document[]> {
    const documents = Array.from(this.documents.values()).filter((doc) =>
      doc.title.toLowerCase().includes(title.toLowerCase()),
    );

    return documents.map((doc) => ({ ...doc }));
  }

  /**
   * 获取未保存的文档
   */
  async findDirtyDocuments(): Promise<Document[]> {
    const documents = Array.from(this.documents.values()).filter((doc) => doc.isDirty);

    return documents.map((doc) => ({ ...doc }));
  }

  private calculateMetadata(content: string): DocumentMetadata {
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter((word) => word.length > 0);

    return {
      wordCount: words.length,
      characterCount: content.length,
      lineCount: lines.length,
      encoding: 'utf-8',
      checksumMd5: this.calculateMd5(content),
      checksumSha256: this.calculateSha256(content),
    };
  }

  private updateSearchIndex(document: Document): void {
    // 移除旧索引
    this.removeFromSearchIndex(document);

    // 构建新索引
    const words = this.extractWords(document.content + ' ' + document.title);

    for (const word of words) {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(document.uuid);
    }
  }

  private removeFromSearchIndex(document: Document): void {
    for (const [word, documentSet] of this.searchIndex.entries()) {
      documentSet.delete(document.uuid);
      if (documentSet.size === 0) {
        this.searchIndex.delete(word);
      }
    }
  }

  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^\w\u4e00-\u9fff]+/) // 支持中文字符
      .filter((word) => word.length > 0);
  }

  private findMatches(document: Document, query: string, options: any): SearchMatch[] {
    const { caseSensitive = false, wholeWord = false, useRegex = false } = options;
    const matches: SearchMatch[] = [];

    let searchText = document.content;
    let searchQuery = query;

    if (!caseSensitive) {
      searchText = searchText.toLowerCase();
      searchQuery = searchQuery.toLowerCase();
    }

    if (useRegex) {
      try {
        const regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
        let match;
        const lines = document.content.split('\n');

        lines.forEach((line, lineIndex) => {
          const lineText = caseSensitive ? line : line.toLowerCase();
          while ((match = regex.exec(lineText)) !== null) {
            matches.push({
              line: lineIndex + 1,
              column: match.index + 1,
              length: match[0].length,
              context: this.getContext(lines, lineIndex, match.index, match[0].length),
              highlightText: match[0],
            });
          }
        });
      } catch (error) {
        // 如果正则表达式无效，回退到普通搜索
        return this.findPlainMatches(document.content, query, options);
      }
    } else {
      return this.findPlainMatches(document.content, query, options);
    }

    return matches;
  }

  private findPlainMatches(content: string, query: string, options: any): SearchMatch[] {
    const { caseSensitive = false, wholeWord = false } = options;
    const matches: SearchMatch[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const searchLine = caseSensitive ? line : line.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();

      let startIndex = 0;
      let matchIndex = searchLine.indexOf(searchQuery, startIndex);

      while (matchIndex !== -1) {
        if (wholeWord) {
          const prevChar = matchIndex > 0 ? line[matchIndex - 1] : ' ';
          const nextChar =
            matchIndex + query.length < line.length ? line[matchIndex + query.length] : ' ';

          if (!/\w/.test(prevChar) && !/\w/.test(nextChar)) {
            matches.push({
              line: lineIndex + 1,
              column: matchIndex + 1,
              length: query.length,
              context: this.getContext(lines, lineIndex, matchIndex, query.length),
              highlightText: line.substring(matchIndex, matchIndex + query.length),
            });
          }
        } else {
          matches.push({
            line: lineIndex + 1,
            column: matchIndex + 1,
            length: query.length,
            context: this.getContext(lines, lineIndex, matchIndex, query.length),
            highlightText: line.substring(matchIndex, matchIndex + query.length),
          });
        }

        startIndex = matchIndex + 1;
        matchIndex = searchLine.indexOf(searchQuery, startIndex);
      }
    }

    return matches;
  }

  private getContext(
    lines: string[],
    lineIndex: number,
    columnIndex: number,
    length: number,
    contextSize: number = 50,
  ): string {
    const line = lines[lineIndex];
    const start = Math.max(0, columnIndex - contextSize);
    const end = Math.min(line.length, columnIndex + length + contextSize);

    let context = line.substring(start, end);

    if (start > 0) context = '...' + context;
    if (end < line.length) context = context + '...';

    return context;
  }

  private calculateScore(document: Document, query: string, matches: SearchMatch[]): number {
    let score = 0;

    // 基础分数：匹配数量
    score += matches.length * 10;

    // 标题匹配加分
    if (document.title.toLowerCase().includes(query.toLowerCase())) {
      score += 50;
    }

    // 文档大小调整（较小的文档分数更高）
    const sizeScore = Math.max(0, 100 - document.metadata.characterCount / 1000);
    score += sizeScore;

    // 最近修改的文档分数更高
    const daysSinceModified =
      (Date.now() - document.lastModifiedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 50 - daysSinceModified);
    score += recencyScore;

    return Math.round(score);
  }

  private generateSnippet(
    content: string,
    firstMatch: SearchMatch,
    maxLength: number = 200,
  ): string {
    const lines = content.split('\n');
    const matchLine = lines[firstMatch.line - 1] || '';

    if (matchLine.length <= maxLength) {
      return matchLine;
    }

    const start = Math.max(0, firstMatch.column - 1 - maxLength / 2);
    const end = Math.min(matchLine.length, start + maxLength);

    let snippet = matchLine.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < matchLine.length) snippet = snippet + '...';

    return snippet;
  }

  private generateUuid(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateMd5(content: string): string {
    // 简单的哈希实现（生产环境应使用实际的MD5库）
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  private calculateSha256(content: string): string {
    // 简单的哈希实现（生产环境应使用实际的SHA256库）
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 7) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private initializeSearchIndex(): void {
    // 初始化搜索索引
    this.searchIndex = new Map();
  }
}
