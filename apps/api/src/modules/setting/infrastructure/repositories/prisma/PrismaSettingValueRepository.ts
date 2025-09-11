/**
 * Prisma Setting Value Repository Implementation
 * Prisma设置值仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// 简化的设置值接口，匹配Prisma模式
interface ISettingValue {
  uuid: string;
  accountUuid: string;
  settingKey: string;
  definitionUuid: string;
  value: any;
  scope: 'global' | 'user' | 'workspace' | 'session';
  isDefault: boolean;
  lastModified: Date;
  modifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaSettingValueRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapSettingValueToDTO(value: any): ISettingValue {
    return {
      uuid: value.uuid,
      accountUuid: value.accountUuid,
      settingKey: value.settingKey,
      definitionUuid: value.definitionUuid,
      value: value.value ? JSON.parse(value.value) : null,
      scope: value.scope,
      isDefault: value.isDefault,
      lastModified: value.lastModified,
      modifiedBy: value.modifiedBy,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  }

  // ===== CRUD 操作 =====

  async findById(uuid: string): Promise<ISettingValue | null> {
    const value = await this.prisma.settingValue.findUnique({
      where: { uuid },
    });

    return value ? this.mapSettingValueToDTO(value) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<ISettingValue[]> {
    const values = await this.prisma.settingValue.findMany({
      where: { accountUuid },
      orderBy: { settingKey: 'asc' },
    });

    return values.map((value) => this.mapSettingValueToDTO(value));
  }

  async findBySettingKey(accountUuid: string, settingKey: string): Promise<ISettingValue | null> {
    const value = await this.prisma.settingValue.findFirst({
      where: {
        accountUuid,
        settingKey,
      },
    });

    return value ? this.mapSettingValueToDTO(value) : null;
  }

  async findByScope(accountUuid: string, scope: string): Promise<ISettingValue[]> {
    const values = await this.prisma.settingValue.findMany({
      where: {
        accountUuid,
        scope,
      },
      orderBy: { settingKey: 'asc' },
    });

    return values.map((value) => this.mapSettingValueToDTO(value));
  }

  async save(accountUuid: string, settingValue: ISettingValue): Promise<void> {
    const data = {
      accountUuid,
      settingKey: settingValue.settingKey,
      definitionUuid: settingValue.definitionUuid,
      value: JSON.stringify(settingValue.value),
      scope: settingValue.scope,
      isDefault: settingValue.isDefault,
      lastModified: new Date(),
      modifiedBy: settingValue.modifiedBy,
    };

    await this.prisma.settingValue.upsert({
      where: { uuid: settingValue.uuid },
      update: data,
      create: {
        uuid: settingValue.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.settingValue.delete({
      where: { uuid },
    });
  }

  async updateValue(uuid: string, value: any): Promise<void> {
    await this.prisma.settingValue.update({
      where: { uuid },
      data: {
        value: JSON.stringify(value),
        updatedAt: new Date(),
      },
    });
  }

  // ===== 设置特定操作 =====

  async setSetting(
    accountUuid: string,
    settingKey: string,
    value: any,
    scope = 'user',
  ): Promise<void> {
    // 首先查找设置定义以获取definitionUuid
    const definition = await this.prisma.settingDefinition.findUnique({
      where: { key: settingKey },
    });

    if (!definition) {
      throw new Error(`Setting definition not found for key: ${settingKey}`);
    }

    // 查找是否已存在该设置
    const existing = await this.prisma.settingValue.findFirst({
      where: {
        accountUuid,
        settingKey,
      },
    });

    if (existing) {
      // 更新现有值
      await this.prisma.settingValue.update({
        where: { uuid: existing.uuid },
        data: {
          value: JSON.stringify(value),
          scope,
          lastModified: new Date(),
        },
      });
    } else {
      // 创建新值
      await this.prisma.settingValue.create({
        data: {
          uuid: randomUUID(),
          accountUuid,
          settingKey,
          definitionUuid: definition.uuid,
          value: JSON.stringify(value),
          scope,
          isDefault: false,
          lastModified: new Date(),
        },
      });
    }
  }

  async getSetting(accountUuid: string, settingKey: string): Promise<any> {
    const value = await this.prisma.settingValue.findFirst({
      where: {
        accountUuid,
        settingKey,
      },
    });

    return value?.value ? JSON.parse(value.value) : null;
  }

  async deleteSetting(accountUuid: string, settingKey: string): Promise<void> {
    await this.prisma.settingValue.deleteMany({
      where: {
        accountUuid,
        settingKey,
      },
    });
  }

  async resetToDefault(accountUuid: string, settingKey: string): Promise<void> {
    // 删除用户自定义值，将使用默认值
    await this.deleteSetting(accountUuid, settingKey);
  }

  // ===== 批量操作 =====

  async batchSetSettings(accountUuid: string, settings: Record<string, any>): Promise<void> {
    const operations = Object.entries(settings).map(([key, value]) =>
      this.setSetting(accountUuid, key, value),
    );

    await Promise.all(operations);
  }

  async batchDeleteSettings(accountUuid: string, settingKeys: string[]): Promise<void> {
    await this.prisma.settingValue.deleteMany({
      where: {
        accountUuid,
        settingKey: { in: settingKeys },
      },
    });
  }

  // ===== 统计查询 =====

  async getTotalCount(accountUuid: string): Promise<number> {
    return await this.prisma.settingValue.count({
      where: { accountUuid },
    });
  }

  async getCountByScope(accountUuid: string): Promise<Record<string, number>> {
    const counts = await this.prisma.settingValue.groupBy({
      by: ['scope'],
      where: { accountUuid },
      _count: { scope: true },
    });

    const result: Record<string, number> = {};
    counts.forEach((count) => {
      result[count.scope] = count._count.scope;
    });

    return result;
  }

  // ===== 导入导出 =====

  async exportSettings(accountUuid: string): Promise<Record<string, any>> {
    const values = await this.findByAccountUuid(accountUuid);
    const result: Record<string, any> = {};

    values.forEach((value) => {
      result[value.settingKey] = value.value;
    });

    return result;
  }

  async importSettings(accountUuid: string, settings: Record<string, any>): Promise<void> {
    await this.batchSetSettings(accountUuid, settings);
  }
}
