/**
 * Prisma Setting Definition Repository Implementation
 * Prisma设置定义仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { SettingContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用（根据实际的Setting contracts调整）
// 假设Setting module有类似的contracts结构
interface ISettingDefinition {
  uuid: string;
  key: string;
  title: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
  scope: 'global' | 'user' | 'workspace' | 'session';
  category: string;
  defaultValue: any;
  currentValue?: any;
  options: any[];
  validationRules: any[];
  readonly: boolean;
  hidden: boolean;
  requiresRestart: boolean;
  sortOrder: number;
  dependsOn: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaSettingDefinitionRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapSettingDefinitionToDTO(definition: any): ISettingDefinition {
    return {
      uuid: definition.uuid,
      key: definition.key,
      title: definition.title,
      description: definition.description,
      type: definition.type,
      scope: definition.scope,
      category: definition.category,
      defaultValue: definition.defaultValue ? JSON.parse(definition.defaultValue) : null,
      currentValue: definition.currentValue ? JSON.parse(definition.currentValue) : null,
      options: definition.options ? JSON.parse(definition.options) : [],
      validationRules: definition.validationRules ? JSON.parse(definition.validationRules) : [],
      readonly: definition.readonly,
      hidden: definition.hidden,
      requiresRestart: definition.requiresRestart,
      sortOrder: definition.sortOrder,
      dependsOn: definition.dependsOn ? JSON.parse(definition.dependsOn) : [],
      tags: definition.tags ? JSON.parse(definition.tags) : [],
      createdAt: definition.createdAt,
      updatedAt: definition.updatedAt,
    };
  }

  // ===== CRUD 操作 =====

  async findById(uuid: string): Promise<ISettingDefinition | null> {
    const definition = await this.prisma.settingDefinition.findUnique({
      where: { uuid },
    });

    return definition ? this.mapSettingDefinitionToDTO(definition) : null;
  }

  async findByKey(key: string): Promise<ISettingDefinition | null> {
    const definition = await this.prisma.settingDefinition.findUnique({
      where: { key },
    });

    return definition ? this.mapSettingDefinitionToDTO(definition) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: { accountUuid },
      orderBy: [{ metadataPriority: 'desc' }, { metadataOrder: 'asc' }, { name: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findByGroupUuid(groupUuid: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: { groupUuid },
      orderBy: [{ metadataOrder: 'asc' }, { name: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findByCategory(accountUuid: string, category: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        category,
      },
      orderBy: [{ metadataPriority: 'desc' }, { metadataOrder: 'asc' }, { name: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findSystemSettings(): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: { isSystem: true },
      orderBy: [{ metadataPriority: 'desc' }, { metadataOrder: 'asc' }, { name: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findRequiredSettings(accountUuid: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        isRequired: true,
      },
      orderBy: [{ metadataPriority: 'desc' }, { metadataOrder: 'asc' }, { name: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async save(accountUuid: string, settingDefinition: ISettingDefinition): Promise<void> {
    const data = {
      accountUuid,
      name: settingDefinition.name,
      description: settingDefinition.description,
      key: settingDefinition.key,
      dataType: settingDefinition.dataType,
      defaultValue: JSON.stringify(settingDefinition.defaultValue),
      schema: settingDefinition.schema ? JSON.stringify(settingDefinition.schema) : null,
      category: settingDefinition.category,
      groupUuid: settingDefinition.groupUuid,
      isRequired: settingDefinition.isRequired,
      isReadonly: settingDefinition.isReadonly,
      isSystem: settingDefinition.isSystem,
      // 验证规则展开
      validationMin: settingDefinition.validation?.min,
      validationMax: settingDefinition.validation?.max,
      validationPattern: settingDefinition.validation?.pattern,
      validationOptions: settingDefinition.validation?.options
        ? JSON.stringify(settingDefinition.validation.options)
        : null,
      // 元数据展开
      metadataTags: JSON.stringify(settingDefinition.metadata.tags),
      metadataPriority: settingDefinition.metadata.priority,
      metadataOrder: settingDefinition.metadata.order,
      // 生命周期信息
      deprecatedAt: settingDefinition.lifecycle.deprecatedAt,
      version: settingDefinition.lifecycle.version,
    };

    await this.prisma.settingDefinition.upsert({
      where: { uuid: settingDefinition.uuid },
      update: data,
      create: {
        uuid: settingDefinition.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.settingDefinition.delete({
      where: { uuid },
    });
  }

  async deprecate(uuid: string): Promise<void> {
    await this.prisma.settingDefinition.update({
      where: { uuid },
      data: {
        deprecatedAt: new Date(),
        version: {
          increment: 1,
        },
      },
    });
  }

  // ===== 搜索和查询 =====

  async searchByName(accountUuid: string, searchTerm: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { key: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ metadataPriority: 'desc' }, { metadataOrder: 'asc' }, { name: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findByDataType(accountUuid: string, dataType: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        dataType,
      },
      orderBy: [{ metadataPriority: 'desc' }, { metadataOrder: 'asc' }, { name: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findByTags(accountUuid: string, tags: string[]): Promise<ISettingDefinition[]> {
    // 由于tags存储为JSON，需要使用原始SQL查询或者在应用层过滤
    const definitions = await this.prisma.settingDefinition.findMany({
      where: { accountUuid },
      orderBy: [{ metadataPriority: 'desc' }, { metadataOrder: 'asc' }, { name: 'asc' }],
    });

    // 在应用层过滤包含指定标签的定义
    const filtered = definitions.filter((def) => {
      const defTags = def.metadataTags ? JSON.parse(def.metadataTags) : [];
      return tags.some((tag) => defTags.includes(tag));
    });

    return filtered.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  // ===== 统计查询 =====

  async getCountByCategory(accountUuid: string): Promise<Record<string, number>> {
    const counts = await this.prisma.settingDefinition.groupBy({
      by: ['category'],
      where: { accountUuid },
      _count: { category: true },
    });

    const result: Record<string, number> = {};
    counts.forEach((count) => {
      result[count.category] = count._count.category;
    });

    return result;
  }

  async getCountByDataType(accountUuid: string): Promise<Record<string, number>> {
    const counts = await this.prisma.settingDefinition.groupBy({
      by: ['dataType'],
      where: { accountUuid },
      _count: { dataType: true },
    });

    const result: Record<string, number> = {};
    counts.forEach((count) => {
      result[count.dataType] = count._count.dataType;
    });

    return result;
  }

  async getTotalCount(accountUuid: string): Promise<number> {
    return await this.prisma.settingDefinition.count({
      where: { accountUuid },
    });
  }

  async getRequiredCount(accountUuid: string): Promise<number> {
    return await this.prisma.settingDefinition.count({
      where: {
        accountUuid,
        isRequired: true,
      },
    });
  }

  async getSystemCount(): Promise<number> {
    return await this.prisma.settingDefinition.count({
      where: { isSystem: true },
    });
  }

  // ===== 批量操作 =====

  async batchDelete(uuids: string[]): Promise<void> {
    await this.prisma.settingDefinition.deleteMany({
      where: { uuid: { in: uuids } },
    });
  }

  async batchUpdateCategory(uuids: string[], category: string): Promise<void> {
    await this.prisma.settingDefinition.updateMany({
      where: { uuid: { in: uuids } },
      data: { category },
    });
  }

  async batchUpdateGroup(uuids: string[], groupUuid: string): Promise<void> {
    await this.prisma.settingDefinition.updateMany({
      where: { uuid: { in: uuids } },
      data: { groupUuid },
    });
  }

  // ===== 验证和检查 =====

  async keyExists(key: string, excludeUuid?: string): Promise<boolean> {
    const count = await this.prisma.settingDefinition.count({
      where: {
        key,
        uuid: excludeUuid ? { not: excludeUuid } : undefined,
      },
    });

    return count > 0;
  }

  async validateDefinition(
    definition: ISettingDefinition,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 检查key是否唯一
    if (await this.keyExists(definition.key, definition.uuid)) {
      errors.push(`Setting key '${definition.key}' already exists`);
    }

    // 检查必填字段
    if (!definition.name?.trim()) {
      errors.push('Name is required');
    }

    if (!definition.key?.trim()) {
      errors.push('Key is required');
    }

    if (!definition.dataType) {
      errors.push('Data type is required');
    }

    // 检查数据类型有效性
    const validDataTypes = ['string', 'number', 'boolean', 'object', 'array'];
    if (!validDataTypes.includes(definition.dataType)) {
      errors.push(`Invalid data type: ${definition.dataType}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
