/**
 * Prisma Resource Repository Implementation
 * Prisma资源仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { RepositoryContracts } from '@dailyuse/contracts';
import type { IResourceRepository } from '@dailyuse/domain-server';

type ResourceDTO = RepositoryContracts.ResourceDTO;
type ResourceType = RepositoryContracts.ResourceType;
type ResourceStatus = RepositoryContracts.ResourceStatus;
type IResourceMetadata = RepositoryContracts.IResourceMetadata;

export class PrismaResourceRepository implements IResourceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ============ 基础CRUD操作 ============

  async findByUuid(uuid: string): Promise<ResourceDTO | null> {
    try {
      // 防御式编程：避免向 Prisma 传入 undefined，直接返回 null
      if (!uuid || typeof uuid !== 'string') {
        return null;
      }
      const resource = await this.prisma.resource.findUnique({
        where: { uuid },
      });

      return resource ? this.toDTOFromPrisma(resource) : null;
    } catch (error) {
      throw new Error(`Failed to find resource by UUID: ${(error as Error).message}`);
    }
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: { repositoryUuid },
        orderBy: { createdAt: 'desc' },
      });

      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find resources by repository UUID: ${(error as Error).message}`);
    }
  }

  async findByPath(repositoryUuid: string, path: string): Promise<ResourceDTO | null> {
    try {
      const resource = await this.prisma.resource.findFirst({
        where: {
          repositoryUuid,
          path,
        },
      });

      return resource ? this.toDTOFromPrisma(resource) : null;
    } catch (error) {
      throw new Error(`Failed to find resource by path: ${(error as Error).message}`);
    }
  }

  async save(resource: ResourceDTO): Promise<void> {
    try {
      await this.prisma.resource.upsert({
        where: { uuid: resource.uuid },
        update: {
          name: resource.name,
          type: resource.type,
          path: resource.path,
          size: resource.size,
          description: resource.description,
          author: resource.author,
          version: resource.version,
          tags: JSON.stringify(resource.tags),
          category: resource.category,
          status: resource.status,
          metadata: JSON.stringify(resource.metadata),
          modifiedAt: resource.modifiedAt,
          updatedAt: resource.updatedAt,
        },
        create: {
          uuid: resource.uuid,
          repositoryUuid: resource.repositoryUuid,
          name: resource.name,
          type: resource.type,
          path: resource.path,
          size: resource.size,
          description: resource.description,
          author: resource.author,
          version: resource.version,
          tags: JSON.stringify(resource.tags),
          category: resource.category,
          status: resource.status,
          metadata: JSON.stringify(resource.metadata),
          modifiedAt: resource.modifiedAt,
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt,
        },
      });
    } catch (error) {
      throw new Error(`Failed to save resource: ${(error as Error).message}`);
    }
  }

  async delete(uuid: string): Promise<void> {
    try {
      await this.prisma.resource.delete({
        where: { uuid },
      });
    } catch (error) {
      throw new Error(`Failed to delete resource: ${(error as Error).message}`);
    }
  }

  async exists(uuid: string): Promise<boolean> {
    try {
      const count = await this.prisma.resource.count({
        where: { uuid },
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to check resource existence: ${(error as Error).message}`);
    }
  }

  // ============ 查询操作 ============

  async findWithPagination(params: {
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
  }> {
    try {
      const where: any = { repositoryUuid: params.repositoryUuid };

      if (params.type) {
        where.type = params.type;
      }

      if (params.status) {
        where.status = params.status;
      }

      if (params.searchTerm) {
        where.OR = [
          { name: { contains: params.searchTerm, mode: 'insensitive' } },
          { description: { contains: params.searchTerm, mode: 'insensitive' } },
          { path: { contains: params.searchTerm, mode: 'insensitive' } },
        ];
      }

      if (params.tags && params.tags.length > 0) {
        where.tags = {
          contains: params.tags[0],
        };
      }

      const [resources, total] = await Promise.all([
        this.prisma.resource.findMany({
          where,
          skip: (params.page - 1) * params.limit,
          take: params.limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.resource.count({ where }),
      ]);

      return {
        resources: resources.map((resource) => this.toDTOFromPrisma(resource)),
        total,
        page: params.page,
        limit: params.limit,
      };
    } catch (error) {
      throw new Error(`Failed to find resources with pagination: ${(error as Error).message}`);
    }
  }

  async findByType(repositoryUuid: string, type: ResourceType): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: { repositoryUuid, type },
        orderBy: { createdAt: 'desc' },
      });
      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find resources by type: ${(error as Error).message}`);
    }
  }

  async findByStatus(repositoryUuid: string, status: ResourceStatus): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: { repositoryUuid, status },
        orderBy: { createdAt: 'desc' },
      });
      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find resources by status: ${(error as Error).message}`);
    }
  }

  async findByTags(repositoryUuid: string, tags: string[]): Promise<ResourceDTO[]> {
    try {
      if (tags.length === 0) {
        return [];
      }

      const resources = await this.prisma.resource.findMany({
        where: {
          repositoryUuid,
          tags: {
            contains: tags[0],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find resources by tags: ${(error as Error).message}`);
    }
  }

  async findByNamePattern(repositoryUuid: string, namePattern: string): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: {
          repositoryUuid,
          name: { contains: namePattern, mode: 'insensitive' },
        },
        orderBy: { name: 'asc' },
      });
      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find resources by name pattern: ${(error as Error).message}`);
    }
  }

  // ============ 数据转换方法 ============

  private toDTOFromPrisma(prismaResource: any): ResourceDTO {
    try {
      return {
        uuid: prismaResource.uuid,
        repositoryUuid: prismaResource.repositoryUuid,
        name: prismaResource.name,
        type: prismaResource.type as ResourceType,
        path: prismaResource.path,
        size: prismaResource.size,
        description: prismaResource.description || undefined,
        author: prismaResource.author || undefined,
        version: prismaResource.version || undefined,
        tags: prismaResource.tags ? JSON.parse(prismaResource.tags) : [],
        category: prismaResource.category || undefined,
        status: prismaResource.status as ResourceStatus,
        metadata: prismaResource.metadata ? JSON.parse(prismaResource.metadata) : {},
        modifiedAt: prismaResource.modifiedAt || undefined,
        createdAt: prismaResource.createdAt,
        updatedAt: prismaResource.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to convert Prisma entity to DTO: ${(error as Error).message}`);
    }
  }

  // ============ 其他必需方法（简化实现） ============

  async findByParent(parentResourceUuid: string): Promise<ResourceDTO[]> {
    return [];
  }

  async findRecentlyAccessed(repositoryUuid: string, limit: number): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: { repositoryUuid },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });
      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find recently accessed resources: ${(error as Error).message}`);
    }
  }

  async findRecentlyModified(repositoryUuid: string, limit: number): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: {
          repositoryUuid,
          modifiedAt: { not: null },
        },
        orderBy: { modifiedAt: 'desc' },
        take: limit,
      });
      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find recently modified resources: ${(error as Error).message}`);
    }
  }

  async findFavorites(repositoryUuid: string): Promise<ResourceDTO[]> {
    return [];
  }

  async searchContent(repositoryUuid: string, searchTerm: string): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: {
          repositoryUuid,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { path: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to search resource content: ${(error as Error).message}`);
    }
  }

  async findByAuthor(repositoryUuid: string, author: string): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: { repositoryUuid, author },
        orderBy: { createdAt: 'desc' },
      });
      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find resources by author: ${(error as Error).message}`);
    }
  }

  async findByCategory(repositoryUuid: string, category: string): Promise<ResourceDTO[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        where: { repositoryUuid, category },
        orderBy: { createdAt: 'desc' },
      });
      return resources.map((resource) => this.toDTOFromPrisma(resource));
    } catch (error) {
      throw new Error(`Failed to find resources by category: ${(error as Error).message}`);
    }
  }

  async findBySizeRange(
    repositoryUuid: string,
    minSize: number,
    maxSize?: number,
  ): Promise<ResourceDTO[]> {
    return [];
  }

  async findByCreatedDateRange(
    repositoryUuid: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<ResourceDTO[]> {
    return [];
  }

  async findByModifiedDateRange(
    repositoryUuid: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<ResourceDTO[]> {
    return [];
  }

  async getRepositoryStats(repositoryUuid: string): Promise<{
    totalResources: number;
    resourcesByType: Record<ResourceType, number>;
    resourcesByStatus: Record<ResourceStatus, number>;
    totalSize: number;
    averageSize: number;
    recentActiveCount: number;
    favoriteCount: number;
  }> {
    try {
      const totalResources = await this.prisma.resource.count({
        where: { repositoryUuid },
      });

      return {
        totalResources,
        resourcesByType: {
          [RepositoryContracts.ResourceType.MARKDOWN]: 0,
          [RepositoryContracts.ResourceType.IMAGE]: 0,
          [RepositoryContracts.ResourceType.VIDEO]: 0,
          [RepositoryContracts.ResourceType.AUDIO]: 0,
          [RepositoryContracts.ResourceType.PDF]: 0,
          [RepositoryContracts.ResourceType.LINK]: 0,
          [RepositoryContracts.ResourceType.CODE]: 0,
          [RepositoryContracts.ResourceType.OTHER]: 0,
        },
        resourcesByStatus: {
          [RepositoryContracts.ResourceStatus.ACTIVE]: 0,
          [RepositoryContracts.ResourceStatus.ARCHIVED]: 0,
          [RepositoryContracts.ResourceStatus.DELETED]: 0,
          [RepositoryContracts.ResourceStatus.DRAFT]: 0,
        },
        totalSize: 0,
        averageSize: 0,
        recentActiveCount: 0,
        favoriteCount: 0,
      };
    } catch (error) {
      throw new Error(`Failed to get repository stats: ${(error as Error).message}`);
    }
  }

  async getTypeDistribution(repositoryUuid: string): Promise<Record<ResourceType, number>> {
    return {
      [RepositoryContracts.ResourceType.MARKDOWN]: 0,
      [RepositoryContracts.ResourceType.IMAGE]: 0,
      [RepositoryContracts.ResourceType.VIDEO]: 0,
      [RepositoryContracts.ResourceType.AUDIO]: 0,
      [RepositoryContracts.ResourceType.PDF]: 0,
      [RepositoryContracts.ResourceType.LINK]: 0,
      [RepositoryContracts.ResourceType.CODE]: 0,
      [RepositoryContracts.ResourceType.OTHER]: 0,
    };
  }

  async getTagStats(repositoryUuid: string): Promise<Array<{ tag: string; count: number }>> {
    return [];
  }

  async getAuthorStats(
    repositoryUuid: string,
  ): Promise<Array<{ author: string; resourceCount: number; lastActivity: Date }>> {
    return [];
  }

  async saveMany(resources: ResourceDTO[]): Promise<void> {
    for (const resource of resources) {
      await this.save(resource);
    }
  }

  async deleteMany(uuids: string[]): Promise<void> {
    try {
      await this.prisma.resource.deleteMany({
        where: { uuid: { in: uuids } },
      });
    } catch (error) {
      throw new Error(`Failed to delete many resources: ${(error as Error).message}`);
    }
  }

  async updateStatusBatch(uuids: string[], status: ResourceStatus): Promise<void> {
    try {
      await this.prisma.resource.updateMany({
        where: { uuid: { in: uuids } },
        data: { status, updatedAt: new Date() },
      });
    } catch (error) {
      throw new Error(`Failed to update status batch: ${(error as Error).message}`);
    }
  }

  async addTagsBatch(uuids: string[], tags: string[]): Promise<void> {}
  async removeTagsBatch(uuids: string[], tags: string[]): Promise<void> {}
  async updateCategoryBatch(uuids: string[], category: string): Promise<void> {}
  async setParentChild(childUuid: string, parentUuid: string): Promise<void> {}
  async removeParentChild(childUuid: string): Promise<void> {}
  async getDescendants(parentUuid: string): Promise<ResourceDTO[]> {
    return [];
  }
  async getAncestorPath(resourceUuid: string): Promise<ResourceDTO[]> {
    return [];
  }
  async cleanupDeleted(repositoryUuid: string, olderThanDays: number): Promise<number> {
    return 0;
  }
  async updateAccessRecord(uuid: string, accessedAt: Date): Promise<void> {}
  async rebuildIndex(repositoryUuid: string): Promise<void> {}
  async checkIntegrity(
    repositoryUuid: string,
  ): Promise<{ checkedCount: number; brokenCount: number; brokenResources: string[] }> {
    return { checkedCount: 0, brokenCount: 0, brokenResources: [] };
  }
  async syncFileSystem(
    repositoryUuid: string,
  ): Promise<{ addedCount: number; modifiedCount: number; deletedCount: number }> {
    return { addedCount: 0, modifiedCount: 0, deletedCount: 0 };
  }
  async findDuplicates(
    repositoryUuid: string,
  ): Promise<Array<{ checksum: string; resources: ResourceDTO[] }>> {
    return [];
  }
  async findOrphaned(repositoryUuid: string): Promise<ResourceDTO[]> {
    return [];
  }
  async findLargeFiles(repositoryUuid: string, sizeThreshold: number): Promise<ResourceDTO[]> {
    return [];
  }
  async findStaleResources(repositoryUuid: string, daysThreshold: number): Promise<ResourceDTO[]> {
    return [];
  }
  async findByMetadata(
    repositoryUuid: string,
    metadataQuery: Partial<IResourceMetadata>,
  ): Promise<ResourceDTO[]> {
    return [];
  }
}
