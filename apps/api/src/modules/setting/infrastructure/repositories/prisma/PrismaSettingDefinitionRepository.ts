/**
 * Prisma Setting Definition Repository Implementation
 * Prisma设置定义仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// 根据实际Prisma模式定义的接口
interface ISettingDefinition {
  uuid: string;
  accountUuid: string;
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
      accountUuid: definition.accountUuid,
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
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findByCategory(accountUuid: string, category: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        category,
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findSystemSettings(accountUuid: string): Promise<ISettingDefinition[]> {
    // 使用category来识别系统设置
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        category: 'system',
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findRequiredSettings(accountUuid: string): Promise<ISettingDefinition[]> {
    // 使用hidden=false来表示必需设置
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        hidden: false,
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async save(accountUuid: string, settingDefinition: ISettingDefinition): Promise<void> {
    const data = {
      accountUuid,
      key: settingDefinition.key,
      title: settingDefinition.title,
      description: settingDefinition.description,
      type: settingDefinition.type,
      scope: settingDefinition.scope,
      category: settingDefinition.category,
      defaultValue: JSON.stringify(settingDefinition.defaultValue),
      currentValue: settingDefinition.currentValue
        ? JSON.stringify(settingDefinition.currentValue)
        : null,
      options: JSON.stringify(settingDefinition.options),
      validationRules: JSON.stringify(settingDefinition.validationRules),
      readonly: settingDefinition.readonly,
      hidden: settingDefinition.hidden,
      requiresRestart: settingDefinition.requiresRestart,
      sortOrder: settingDefinition.sortOrder,
      dependsOn: JSON.stringify(settingDefinition.dependsOn),
      tags: JSON.stringify(settingDefinition.tags),
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
    // 由于没有deprecatedAt字段，我们可以使用hidden字段来表示废弃状态
    await this.prisma.settingDefinition.update({
      where: { uuid },
      data: {
        hidden: true,
        // 如果有version字段，可以增加版本号
        // version: { increment: 1 },
      },
    });
  }

  // ===== 搜索和查询 =====

  async searchByName(accountUuid: string, searchTerm: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { key: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findByType(accountUuid: string, type: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        type,
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findByScope(accountUuid: string, scope: string): Promise<ISettingDefinition[]> {
    const definitions = await this.prisma.settingDefinition.findMany({
      where: {
        accountUuid,
        scope,
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    return definitions.map((definition) => this.mapSettingDefinitionToDTO(definition));
  }

  async findByTags(accountUuid: string, tags: string[]): Promise<ISettingDefinition[]> {
    // 由于tags存储为JSON，需要在应用层过滤
    const definitions = await this.prisma.settingDefinition.findMany({
      where: { accountUuid },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });

    // 在应用层过滤包含指定标签的定义
    const filtered = definitions.filter((def) => {
      const defTags = def.tags ? JSON.parse(def.tags) : [];
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

  async getCountByType(accountUuid: string): Promise<Record<string, number>> {
    const counts = await this.prisma.settingDefinition.groupBy({
      by: ['type'],
      where: { accountUuid },
      _count: { type: true },
    });

    const result: Record<string, number> = {};
    counts.forEach((count) => {
      result[count.type] = count._count.type;
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
        hidden: false, // 使用hidden=false来表示必需设置
      },
    });
  }

  async getSystemCount(accountUuid: string): Promise<number> {
    return await this.prisma.settingDefinition.count({
      where: {
        accountUuid,
        category: 'system',
      },
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

  async batchUpdateScope(uuids: string[], scope: string): Promise<void> {
    await this.prisma.settingDefinition.updateMany({
      where: { uuid: { in: uuids } },
      data: { scope },
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
    if (!definition.title?.trim()) {
      errors.push('Title is required');
    }

    if (!definition.key?.trim()) {
      errors.push('Key is required');
    }

    if (!definition.type) {
      errors.push('Type is required');
    }

    // 检查数据类型有效性
    const validTypes = ['string', 'number', 'boolean', 'object', 'array', 'enum'];
    if (!validTypes.includes(definition.type)) {
      errors.push(`Invalid type: ${definition.type}`);
    }

    // 检查作用域有效性
    const validScopes = ['global', 'user', 'workspace', 'session'];
    if (!validScopes.includes(definition.scope)) {
      errors.push(`Invalid scope: ${definition.scope}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
