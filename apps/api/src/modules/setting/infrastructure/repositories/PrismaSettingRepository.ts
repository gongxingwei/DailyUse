import { PrismaClient } from '@prisma/client';
import type { ISettingRepository } from '@dailyuse/domain-server';
import { Setting } from '@dailyuse/domain-server';
import { SettingContracts } from '@dailyuse/contracts';

type SettingScope = SettingContracts.SettingScope;
const SettingScope = SettingContracts.SettingScope;

/**
 * Setting Prisma 仓储实现
 * 负责 Setting 聚合根的持久化
 *
 * TODO: 需要先创建 Prisma schema 定义
 * - Setting 表
 * - SettingHistory 表
 */
export class PrismaSettingRepository implements ISettingRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 Setting 聚合根
   */
  private mapToEntity(data: any): Setting {
    return Setting.fromPersistenceDTO({
      uuid: data.uuid,
      key: data.key,
      name: data.name,
      description: data.description,
      valueType: data.valueType,
      value: data.value,
      defaultValue: data.defaultValue,
      scope: data.scope,
      accountUuid: data.accountUuid,
      deviceId: data.deviceId,
      groupUuid: data.groupUuid,
      validation: data.validation,
      ui: data.ui,
      isEncrypted: data.isEncrypted,
      isReadOnly: data.isReadOnly,
      isSystemSetting: data.isSystemSetting,
      syncConfig: data.syncConfig,
      history: data.historyData, // Prisma field is historyData
      createdAt: Number(data.createdAt),
      updatedAt: Number(data.updatedAt),
      deletedAt: data.deletedAt ? Number(data.deletedAt) : null,
    });
  }

  /**
   * 转换时间戳为 Date 对象
   */
  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  // ===== ISettingRepository 接口实现 =====

  async save(setting: Setting): Promise<void> {
    const persistence = setting.toPersistenceDTO();
    const data = {
      uuid: persistence.uuid,
      key: persistence.key,
      name: persistence.name,
      description: persistence.description,
      valueType: persistence.valueType,
      value: persistence.value,
      defaultValue: persistence.defaultValue,
      scope: persistence.scope,
      accountUuid: persistence.accountUuid,
      deviceId: persistence.deviceId,
      groupUuid: persistence.groupUuid,
      validation: persistence.validation,
      ui: persistence.ui,
      isEncrypted: persistence.isEncrypted,
      isReadOnly: persistence.isReadOnly,
      isSystemSetting: persistence.isSystemSetting,
      syncConfig: persistence.syncConfig,
      historyData: persistence.history, // Map to Prisma field historyData
      createdAt: this.toDate(persistence.createdAt) ?? new Date(),
      updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
      deletedAt: this.toDate(persistence.deletedAt),
    };

    await this.prisma.setting.upsert({
      where: { uuid: persistence.uuid },
      create: data,
      update: {
        ...data,
        uuid: undefined,
        key: undefined,
        createdAt: undefined,
      },
    });
  }

  async findByUuid(uuid: string): Promise<Setting | null> {
    const data = await this.prisma.setting.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findById(uuid: string, options?: { includeHistory?: boolean }): Promise<Setting | null> {
    // Note: includeHistory option is not used since history is already included in the entity
    // The history field is stored as JSON in the database and mapped to the entity
    return this.findByUuid(uuid);
  }

  async findByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<Setting | null> {
    const where: any = { key, scope, deletedAt: null };
    if (scope === 'USER' && contextUuid) where.accountUuid = contextUuid;
    if (scope === 'DEVICE' && contextUuid) where.deviceId = contextUuid;

    const data = await this.prisma.setting.findFirst({ where });
    return data ? this.mapToEntity(data) : null;
  }

  async findByScope(
    scope: SettingScope,
    contextUuid?: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    const where: any = { scope, deletedAt: null };
    if (scope === 'USER' && contextUuid) where.accountUuid = contextUuid;
    if (scope === 'DEVICE' && contextUuid) where.deviceId = contextUuid;

    const data = await this.prisma.setting.findMany({ where });
    return data.map((item) => this.mapToEntity(item));
  }

  async findByGroup(groupUuid: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    const data = await this.prisma.setting.findMany({
      where: { groupUuid, deletedAt: null },
    });
    return data.map((item) => this.mapToEntity(item));
  }

  async findSystemSettings(options?: { includeHistory?: boolean }): Promise<Setting[]> {
    return this.findByScope(SettingScope.SYSTEM, undefined, options);
  }

  async findUserSettings(
    accountUuid: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    return this.findByScope(SettingScope.USER, accountUuid, options);
  }

  async findDeviceSettings(
    deviceId: string,
    options?: { includeHistory?: boolean },
  ): Promise<Setting[]> {
    return this.findByScope(SettingScope.DEVICE, deviceId, options);
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.setting.update({
      where: { uuid },
      data: { deletedAt: new Date() }, // Use Date instead of BigInt
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.setting.delete({ where: { uuid } });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.setting.count({ where: { uuid } });
    return count > 0;
  }

  async existsByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<boolean> {
    const where: any = { key, scope, deletedAt: null };
    if (scope === 'USER' && contextUuid) where.accountUuid = contextUuid;
    if (scope === 'DEVICE' && contextUuid) where.deviceId = contextUuid;

    const count = await this.prisma.setting.count({ where });
    return count > 0;
  }

  async saveMany(settings: Setting[]): Promise<void> {
    // Using a transaction to ensure all or nothing
    await this.prisma.$transaction(async (tx) => {
      for (const setting of settings) {
        const persistence = setting.toPersistenceDTO();
        const data = {
          uuid: persistence.uuid,
          key: persistence.key,
          name: persistence.name,
          description: persistence.description,
          valueType: persistence.valueType,
          value: persistence.value,
          defaultValue: persistence.defaultValue,
          scope: persistence.scope,
          accountUuid: persistence.accountUuid,
          deviceId: persistence.deviceId,
          groupUuid: persistence.groupUuid,
          validation: persistence.validation,
          ui: persistence.ui,
          isEncrypted: persistence.isEncrypted,
          isReadOnly: persistence.isReadOnly,
          isSystemSetting: persistence.isSystemSetting,
          syncConfig: persistence.syncConfig,
          historyData: persistence.history,
          createdAt: this.toDate(persistence.createdAt) ?? new Date(),
          updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
          deletedAt: this.toDate(persistence.deletedAt),
        };
        await tx.setting.upsert({
          where: { uuid: persistence.uuid },
          create: data,
          update: {
            ...data,
            uuid: undefined,
            key: undefined,
            createdAt: undefined,
          },
        });
      }
    });
  }

  async search(query: string, scope?: SettingScope): Promise<Setting[]> {
    const where: any = {
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { key: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (scope) {
      where.scope = scope;
    }

    const data = await this.prisma.setting.findMany({ where });
    return data.map((item) => this.mapToEntity(item));
  }
}
