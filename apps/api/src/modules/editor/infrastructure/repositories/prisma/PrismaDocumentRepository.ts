/**/**/**

 * Prisma Document Repository Implementation

 * 文档仓储 Prisma 实现 * Prisma Document Repository Implementation * Prisma Document Repository Implementation

 * 

 * 注意：此实现需要Prisma schema支持Document聚合根 * 文档仓储 Prisma 实现 * 文档仓储 Prisma 实现

 * 这是一个示例实现，实际使用需要配置对应的数据库schema

 */ */ */



import { PrismaClient } from '@prisma/client';

import { EditorContracts } from '@dailyuse/contracts';

import type { IDocumentRepository } from '../interfaces/IDocumentRepository';import { PrismaClient } from '@prisma/client';import { PrismaClient } from '@prisma/client';

import crypto from 'crypto';

import { EditorContracts } from '@dailyuse/contracts';import { EditorContracts } from '@dailyuse/contracts';

function generateUuid(): string {

  return crypto.randomUUID();import type { IDocumentRepository } from '../interfaces/IDocumentRepository';import type { IDocumentRepository } from '../interfaces/IDocumentRepository';

}

import crypto from 'crypto';import crypto from 'crypto';

export class PrismaDocumentRepository implements IDocumentRepository {

  constructor(private readonly prisma: PrismaClient) {}



  // ============ 基本CRUD操作 ============function generateUuid(): string {function generateUuid(): string {



  async create(  return crypto.randomUUID();  return crypto.randomUUID();

    accountUuid: string,

    documentData: Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>}}

  ): Promise<EditorContracts.IDocument> {

    const uuid = generateUuid();

    const now = new Date();

export class PrismaDocumentRepository implements IDocumentRepository {export class PrismaDocumentRepository implements IDocumentRepository {

    // TODO: 实际实现需要对应的Prisma schema定义

    // 这里是伪代码实现，展示数据映射逻辑  constructor(private readonly prisma: PrismaClient) {}  constructor(private readonly prisma: PrismaClient) {}

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');

    

    /*

    const document = await this.prisma.document.create({  // ============ 基本CRUD操作 ============  // ============ 基本CRUD操作 ============

      data: {

        uuid,

        accountUuid,

        repositoryUuid: documentData.repositoryUuid,  async create(  async create(

        relativePath: documentData.relativePath,

        fileName: documentData.fileName,    accountUuid: string,    accountUuid: string,

        title: documentData.title,

        content: documentData.content,    documentData: Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>    documentData: Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>

        format: documentData.format,

        metadata: JSON.stringify(documentData.metadata),  ): Promise<EditorContracts.IDocument> {  ): Promise<EditorContracts.IDocument> {

        tags: JSON.stringify(documentData.tags),

        resources: JSON.stringify(documentData.resources),    const uuid = generateUuid();    const uuid = generateUuid();

        versions: JSON.stringify(documentData.versions),

        renderingState: JSON.stringify(documentData.renderingState),    const now = new Date();    const now = new Date();

        createdAt: now,

        updatedAt: now,

        version: 1

      }    // 注意：这里假设Prisma schema已经定义了document表    // 注意：这里假设Prisma schema已经定义了document表

    });

    // 实际的schema需要与Document聚合根对应    // 实际的schema需要与Document聚合根对应

    return this.mapToDomain(document);

    */    const document = await this.prisma.document.create({    const document = await this.prisma.document.create({

  }

      data: {      data: {

  async findByUuid(

    accountUuid: string,        uuid,        uuid,

    documentUuid: string

  ): Promise<EditorContracts.IDocument | null> {        accountUuid,        accountUuid,

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');

  }        repositoryUuid: documentData.repositoryUuid,        repositoryUuid: documentData.repositoryUuid,



  async findByPath(        relativePath: documentData.relativePath,        relativePath: documentData.relativePath,

    accountUuid: string,

    repositoryUuid: string,        fileName: documentData.fileName,        fileName: documentData.fileName,

    relativePath: string

  ): Promise<EditorContracts.IDocument | null> {        title: documentData.title,        title: documentData.title,

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');

  }        content: documentData.content,        content: documentData.content,



  async update(        format: documentData.format,        format: documentData.format,

    accountUuid: string,

    documentUuid: string,        metadata: JSON.stringify(documentData.metadata),        metadata: JSON.stringify(documentData.metadata),

    updates: Partial<EditorContracts.IDocument>

  ): Promise<EditorContracts.IDocument> {        tags: JSON.stringify(documentData.tags),        tags: JSON.stringify(documentData.tags),

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');

  }        resources: JSON.stringify(documentData.resources),        resources: JSON.stringify(documentData.resources),



  async delete(accountUuid: string, documentUuid: string): Promise<void> {        versions: JSON.stringify(documentData.versions),        versions: JSON.stringify(documentData.versions),

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');

  }        renderingState: JSON.stringify(documentData.renderingState),        renderingState: JSON.stringify(documentData.renderingState),



  // ============ 查询操作 ============        lifecycle: {        lifecycle: {



  async findByRepository(          createdAt: now,          createdAt: now,

    accountUuid: string,

    repositoryUuid: string,          updatedAt: now,          updatedAt: now,

    options?: {

      limit?: number;          version: 1          version: 1

      offset?: number;

      sortBy?: 'title' | 'createdAt' | 'updatedAt';        } as any        } as any

      sortOrder?: 'asc' | 'desc';

    }      }      }

  ): Promise<EditorContracts.IDocument[]> {

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');    });    });

  }



  async findByTags(

    accountUuid: string,    return this.mapToDomain(document);    return this.mapToDomain(document);

    tags: string[],

    repositoryUuid?: string  }  }

  ): Promise<EditorContracts.IDocument[]> {

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');

  }

  async findByUuid(  async findByUuid(

  async searchContent(

    accountUuid: string,    accountUuid: string,    accountUuid: string,

    query: string,

    options?: {    documentUuid: string    documentUuid: string

      repositoryUuid?: string;

      format?: EditorContracts.DocumentFormat;  ): Promise<EditorContracts.IDocument | null> {  ): Promise<EditorContracts.IEditorDocument | null> {

      limit?: number;

    }    const document = await this.prisma.document.findFirst({    const document = await this.prisma.editorDocument.findFirst({

  ): Promise<EditorContracts.IDocument[]> {

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');      where: {      where: {

  }

        uuid: documentUuid,        uuid: documentUuid,

  async findRecentlyModified(

    accountUuid: string,        accountUuid        accountUuid

    limit?: number,

    repositoryUuid?: string      }      },

  ): Promise<EditorContracts.IDocument[]> {

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');    });      include: {

  }

        editorSessions: true

  // ============ 统计操作 ============

    return document ? this.mapToDomain(document) : null;      }

  async getCount(accountUuid: string, repositoryUuid?: string): Promise<number> {

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');  }    });

  }



  async getCountByFormat(

    accountUuid: string,  async findByPath(    return document ? this.mapToDomain(document) : null;

    repositoryUuid?: string

  ): Promise<Record<string, number>> {    accountUuid: string,  }

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');

  }    path: string



  // ============ 批量操作 ============  ): Promise<EditorContracts.IDocument | null> {  async findByPath(



  async createMany(    const document = await this.prisma.document.findFirst({    accountUuid: string,

    accountUuid: string,

    documents: Array<Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>>      where: {    path: string

  ): Promise<EditorContracts.IDocument[]> {

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');        accountUuid,  ): Promise<EditorContracts.IEditorDocument | null> {

  }

        relativePath: path    const document = await this.prisma.editorDocument.findFirst({

  async updateMany(

    accountUuid: string,      }      where: {

    updates: Array<{

      documentUuid: string;    });        accountUuid,

      data: Partial<EditorContracts.IDocument>;

    }>        path

  ): Promise<EditorContracts.IDocument[]> {

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');    return document ? this.mapToDomain(document) : null;      },

  }

  }      include: {

  async deleteMany(accountUuid: string, documentUuids: string[]): Promise<void> {

    throw new Error('PrismaDocumentRepository: Requires Prisma schema for Document aggregate');        editorSessions: true

  }

  async update(      }

  // ============ 私有辅助方法 ============

    accountUuid: string,    });

  private mapToDomain(document: any): EditorContracts.IDocument {

    return {    documentUuid: string,

      uuid: document.uuid,

      repositoryUuid: document.repositoryUuid,    updates: Partial<EditorContracts.IDocument>    return document ? this.mapToDomain(document) : null;

      relativePath: document.relativePath,

      fileName: document.fileName,  ): Promise<EditorContracts.IDocument> {  }

      title: document.title,

      content: document.content,    const now = new Date();

      format: document.format as EditorContracts.DocumentFormat,

      metadata: document.metadata ? JSON.parse(document.metadata) : {  async update(

        tags: [],

        category: '',    const document = await this.prisma.document.update({    accountUuid: string,

        wordCount: 0,

        characterCount: 0,      where: {    documentUuid: string,

        readingTime: 0,

        isReadOnly: false,        uuid: documentUuid,    updates: Partial<EditorContracts.IEditorDocument>

        encoding: 'utf-8',

        language: 'markdown'        accountUuid  ): Promise<EditorContracts.IEditorDocument> {

      },

      tags: document.tags ? JSON.parse(document.tags) : [],      },    const now = new Date();

      resources: document.resources ? JSON.parse(document.resources) : [],

      versions: document.versions ? JSON.parse(document.versions) : [],      data: {

      renderingState: document.renderingState ? JSON.parse(document.renderingState) : {

        mode: EditorContracts.RenderingMode.SOURCE_ONLY,        ...(updates.title && { title: updates.title }),    const document = await this.prisma.editorDocument.update({

        isLivePreview: false,

        cursorInRenderedView: false,        ...(updates.content !== undefined && { content: updates.content }),      where: {

        renderedContent: {

          html: '',        ...(updates.relativePath && { relativePath: updates.relativePath }),        uuid: documentUuid,

          toc: { items: [] },

          codeBlocks: [],        ...(updates.fileName && { fileName: updates.fileName }),        accountUuid

          mathBlocks: [],

          imageReferences: []        ...(updates.format && { format: updates.format }),      },

        },

        sourceMap: { mappings: [] }        ...(updates.metadata && { metadata: JSON.stringify(updates.metadata) }),      data: {

      },

      lifecycle: document.lifecycle || {        ...(updates.tags && { tags: JSON.stringify(updates.tags) }),        ...(updates.name && { name: updates.name }),

        createdAt: new Date(),

        updatedAt: new Date(),        ...(updates.resources && { resources: JSON.stringify(updates.resources) }),        ...(updates.content !== undefined && { content: updates.content }),

        version: 1

      }        ...(updates.versions && { versions: JSON.stringify(updates.versions) }),        ...(updates.path && { path: updates.path }),

    };

  }        ...(updates.renderingState && { renderingState: JSON.stringify(updates.renderingState) }),        ...(updates.metadata && { metadata: JSON.stringify(updates.metadata) }),

}
        lifecycle: {        lifecycle: {

          ...(updates.lifecycle || {}),          ...(updates.lifecycle || {}),

          updatedAt: now,          updatedAt: now,

          version: { increment: 1 }          version: { increment: 1 }

        } as any        } as any

      }      },

    });      include: {

        editorSessions: true

    return this.mapToDomain(document);      }

  }    });



  async delete(accountUuid: string, documentUuid: string): Promise<void> {    return this.mapToDomain(document);

    await this.prisma.document.delete({  }

      where: {

        uuid: documentUuid,  async delete(accountUuid: string, documentUuid: string): Promise<void> {

        accountUuid    await this.prisma.editorDocument.delete({

      }      where: {

    });        uuid: documentUuid,

  }        accountUuid

      }

  // ============ 查询操作 ============    });

  }

  async findByAccount(

    accountUuid: string,  // ============ 查询操作 ============

    options?: {

      limit?: number;  async findByAccount(

      offset?: number;    accountUuid: string,

      sortBy?: 'title' | 'createdAt' | 'updatedAt';    options?: {

      sortOrder?: 'asc' | 'desc';      limit?: number;

    }      offset?: number;

  ): Promise<EditorContracts.IDocument[]> {      sortBy?: 'name' | 'createdAt' | 'updatedAt';

    const documents = await this.prisma.document.findMany({      sortOrder?: 'asc' | 'desc';

      where: { accountUuid },    }

      ...(options?.limit && { take: options.limit }),  ): Promise<EditorContracts.IEditorDocument[]> {

      ...(options?.offset && { skip: options.offset }),    const documents = await this.prisma.editorDocument.findMany({

      orderBy: {      where: { accountUuid },

        [options?.sortBy === 'title' ? 'title' : 'lifecycle']:       include: { editorSessions: true },

          options?.sortBy === 'title' ? (options?.sortOrder || 'asc') : { path: ['updatedAt'] }      ...(options?.limit && { take: options.limit }),

      }      ...(options?.offset && { skip: options.offset }),

    });      orderBy: {

        [options?.sortBy || 'updatedAt']: options?.sortOrder || 'desc'

    return documents.map(doc => this.mapToDomain(doc));      }

  }    });



  async findByRepository(    return documents.map(doc => this.mapToDomain(doc));

    accountUuid: string,  }

    repositoryUuid: string

  ): Promise<EditorContracts.IDocument[]> {  async findByRepository(

    const documents = await this.prisma.document.findMany({    accountUuid: string,

      where: {    repositoryUuid: string

        accountUuid,  ): Promise<EditorContracts.IEditorDocument[]> {

        repositoryUuid    const documents = await this.prisma.editorDocument.findMany({

      },      where: {

      orderBy: {         accountUuid,

        lifecycle: { path: ['updatedAt'] }         repositoryUuid

      }      },

    });      include: { editorSessions: true },

      orderBy: { lifecycle: { path: ['updatedAt'] }, mode: 'insensitive' }

    return documents.map(doc => this.mapToDomain(doc));    });

  }

    return documents.map(doc => this.mapToDomain(doc));

  async findByType(  }

    accountUuid: string,

    format: EditorContracts.DocumentFormat  async findByType(

  ): Promise<EditorContracts.IDocument[]> {    accountUuid: string,

    const documents = await this.prisma.document.findMany({    type: EditorContracts.DocumentType

      where: {  ): Promise<EditorContracts.IEditorDocument[]> {

        accountUuid,    const documents = await this.prisma.editorDocument.findMany({

        format: format      where: {

      },        accountUuid,

      orderBy: {         type: type as string

        lifecycle: { path: ['updatedAt'] }       },

      }      include: { editorSessions: true },

    });      orderBy: { lifecycle: { path: ['updatedAt'] }, mode: 'insensitive' }

    });

    return documents.map(doc => this.mapToDomain(doc));

  }    return documents.map(doc => this.mapToDomain(doc));

  }

  async searchByName(

    accountUuid: string,  async searchByName(

    searchTerm: string,    accountUuid: string,

    limit?: number    searchTerm: string,

  ): Promise<EditorContracts.IDocument[]> {    limit?: number

    const documents = await this.prisma.document.findMany({  ): Promise<EditorContracts.IEditorDocument[]> {

      where: {    const documents = await this.prisma.editorDocument.findMany({

        accountUuid,      where: {

        OR: [        accountUuid,

          {        name: {

            title: {          contains: searchTerm,

              contains: searchTerm,          mode: 'insensitive'

              mode: 'insensitive'        }

            }      },

          },      include: { editorSessions: true },

          {      ...(limit && { take: limit }),

            fileName: {      orderBy: { lifecycle: { path: ['updatedAt'] }, mode: 'insensitive' }

              contains: searchTerm,    });

              mode: 'insensitive'

            }    return documents.map(doc => this.mapToDomain(doc));

          }  }

        ]

      },  async searchByContent(

      ...(limit && { take: limit }),    accountUuid: string,

      orderBy: {     searchTerm: string,

        lifecycle: { path: ['updatedAt'] }     limit?: number

      }  ): Promise<EditorContracts.IEditorDocument[]> {

    });    const documents = await this.prisma.editorDocument.findMany({

      where: {

    return documents.map(doc => this.mapToDomain(doc));        accountUuid,

  }        content: {

          contains: searchTerm,

  async searchByContent(          mode: 'insensitive'

    accountUuid: string,        }

    searchTerm: string,      },

    limit?: number      include: { editorSessions: true },

  ): Promise<EditorContracts.IDocument[]> {      ...(limit && { take: limit }),

    const documents = await this.prisma.document.findMany({      orderBy: { lifecycle: { path: ['updatedAt'] }, mode: 'insensitive' }

      where: {    });

        accountUuid,

        content: {    return documents.map(doc => this.mapToDomain(doc));

          contains: searchTerm,  }

          mode: 'insensitive'

        }  async findRecentlyModified(

      },    accountUuid: string,

      ...(limit && { take: limit }),    limit?: number

      orderBy: {   ): Promise<EditorContracts.IEditorDocument[]> {

        lifecycle: { path: ['updatedAt'] }     const documents = await this.prisma.editorDocument.findMany({

      }      where: { accountUuid },

    });      include: { editorSessions: true },

      ...(limit && { take: limit }),

    return documents.map(doc => this.mapToDomain(doc));      orderBy: { lifecycle: { path: ['updatedAt'] }, mode: 'insensitive' }

  }    });



  async findRecentlyModified(    return documents.map(doc => this.mapToDomain(doc));

    accountUuid: string,  }

    limit?: number

  ): Promise<EditorContracts.IDocument[]> {  // ============ 统计操作 ============

    const documents = await this.prisma.document.findMany({

      where: { accountUuid },  async getCount(accountUuid: string): Promise<number> {

      ...(limit && { take: limit }),    return this.prisma.editorDocument.count({

      orderBy: {       where: { accountUuid }

        lifecycle: { path: ['updatedAt'] }     });

      }  }

    });

  async getCountByType(

    return documents.map(doc => this.mapToDomain(doc));    accountUuid: string,

  }    type: EditorContracts.DocumentType

  ): Promise<number> {

  // ============ 统计操作 ============    return this.prisma.editorDocument.count({

      where: {

  async getCount(accountUuid: string): Promise<number> {        accountUuid,

    return this.prisma.document.count({        type: type as string

      where: { accountUuid }      }

    });    });

  }  }



  async getCountByType(  async getDocumentStats(

    accountUuid: string,    accountUuid: string,

    format: EditorContracts.DocumentFormat    documentUuid: string

  ): Promise<number> {  ): Promise<{

    return this.prisma.document.count({    wordCount: number;

      where: {    characterCount: number;

        accountUuid,    lineCount: number;

        format: format    lastModified: Date;

      }  }> {

    });    const document = await this.prisma.editorDocument.findFirst({

  }      where: {

        uuid: documentUuid,

  async getDocumentStats(        accountUuid

    accountUuid: string,      }

    documentUuid: string    });

  ): Promise<{

    wordCount: number;    if (!document) {

    characterCount: number;      throw new Error('Document not found');

    lineCount: number;    }

    lastModified: Date;

  }> {    const content = document.content || '';

    const document = await this.prisma.document.findFirst({    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

      where: {    const characterCount = content.length;

        uuid: documentUuid,    const lineCount = content.split('\n').length;

        accountUuid

      }    return {

    });      wordCount,

      characterCount,

    if (!document) {      lineCount,

      throw new Error('Document not found');      lastModified: (document.lifecycle as any)?.updatedAt || new Date()

    }    };

  }

    const content = document.content || '';

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;  // ============ 批量操作 ============

    const characterCount = content.length;

    const lineCount = content.split('\n').length;  async createMany(

    accountUuid: string,

    return {    documents: Array<Omit<EditorContracts.IEditorDocument, 'uuid' | 'lifecycle'>>

      wordCount,  ): Promise<EditorContracts.IEditorDocument[]> {

      characterCount,    const now = new Date();

      lineCount,    const documentsData = documents.map(doc => ({

      lastModified: (document.lifecycle as any)?.updatedAt || new Date()      uuid: uuidv4(),

    };      accountUuid,

  }      name: doc.name,

      type: doc.type as string,

  // ============ 批量操作 ============      path: doc.path,

      repositoryUuid: doc.repositoryUuid,

  async createMany(      content: doc.content || '',

    accountUuid: string,      metadata: JSON.stringify(doc.metadata || {}),

    documents: Array<Omit<EditorContracts.IDocument, 'uuid' | 'lifecycle'>>      lifecycle: {

  ): Promise<EditorContracts.IDocument[]> {        createdAt: now,

    const now = new Date();        updatedAt: now,

    const documentsData = documents.map(doc => ({        version: 1

      uuid: generateUuid(),      } as any

      accountUuid,    }));

      repositoryUuid: doc.repositoryUuid,

      relativePath: doc.relativePath,    await this.prisma.editorDocument.createMany({

      fileName: doc.fileName,      data: documentsData

      title: doc.title,    });

      content: doc.content,

      format: doc.format,    // Fetch the created documents

      metadata: JSON.stringify(doc.metadata),    const createdDocuments = await this.prisma.editorDocument.findMany({

      tags: JSON.stringify(doc.tags),      where: {

      resources: JSON.stringify(doc.resources),        accountUuid,

      versions: JSON.stringify(doc.versions),        uuid: {

      renderingState: JSON.stringify(doc.renderingState),          in: documentsData.map(doc => doc.uuid)

      lifecycle: {        }

        createdAt: now,      },

        updatedAt: now,      include: { editorSessions: true }

        version: 1    });

      } as any

    }));    return createdDocuments.map(doc => this.mapToDomain(doc));

  }

    await this.prisma.document.createMany({

      data: documentsData  async updateMany(

    });    accountUuid: string,

    updates: Array<{

    // Fetch the created documents      documentUuid: string;

    const createdDocuments = await this.prisma.document.findMany({      data: Partial<EditorContracts.IEditorDocument>;

      where: {    }>

        accountUuid,  ): Promise<EditorContracts.IEditorDocument[]> {

        uuid: {    const results: EditorContracts.IEditorDocument[] = [];

          in: documentsData.map(doc => doc.uuid)

        }    for (const { documentUuid, data } of updates) {

      }      const updated = await this.update(accountUuid, documentUuid, data);

    });      results.push(updated);

    }

    return createdDocuments.map(doc => this.mapToDomain(doc));

  }    return results;

  }

  async updateMany(

    accountUuid: string,  async deleteMany(

    updates: Array<{    accountUuid: string,

      documentUuid: string;    documentUuids: string[]

      data: Partial<EditorContracts.IDocument>;  ): Promise<number> {

    }>    const result = await this.prisma.editorDocument.deleteMany({

  ): Promise<EditorContracts.IDocument[]> {      where: {

    const results: EditorContracts.IDocument[] = [];        accountUuid,

        uuid: {

    for (const { documentUuid, data } of updates) {          in: documentUuids

      const updated = await this.update(accountUuid, documentUuid, data);        }

      results.push(updated);      }

    }    });



    return results;    return result.count;

  }  }



  async deleteMany(  // ============ 私有辅助方法 ============

    accountUuid: string,

    documentUuids: string[]  private mapToDomain(document: any): EditorContracts.IEditorDocument {

  ): Promise<number> {    return {

    const result = await this.prisma.document.deleteMany({      uuid: document.uuid,

      where: {      name: document.name,

        accountUuid,      type: document.type as EditorContracts.DocumentType,

        uuid: {      path: document.path,

          in: documentUuids      repositoryUuid: document.repositoryUuid,

        }      content: document.content,

      }      metadata: document.metadata ? JSON.parse(document.metadata) : {},

    });      lifecycle: document.lifecycle

    };

    return result.count;  }

  }}

  // ============ 私有辅助方法 ============

  private mapToDomain(document: any): EditorContracts.IDocument {
    return {
      uuid: document.uuid,
      repositoryUuid: document.repositoryUuid,
      relativePath: document.relativePath,
      fileName: document.fileName,
      title: document.title,
      content: document.content,
      format: document.format as EditorContracts.DocumentFormat,
      metadata: document.metadata ? JSON.parse(document.metadata) : {},
      tags: document.tags ? JSON.parse(document.tags) : [],
      resources: document.resources ? JSON.parse(document.resources) : [],
      versions: document.versions ? JSON.parse(document.versions) : [],
      renderingState: document.renderingState ? JSON.parse(document.renderingState) : {
        mode: EditorContracts.RenderingMode.SOURCE_ONLY,
        isLivePreview: false,
        cursorInRenderedView: false,
        renderedContent: {
          html: '',
          toc: { items: [] },
          codeBlocks: [],
          mathBlocks: [],
          imageReferences: []
        },
        sourceMap: { mappings: [] }
      },
      lifecycle: document.lifecycle
    };
  }
}