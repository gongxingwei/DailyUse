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
  private mapSettingToEntity(data: any): Setting {
    return Setting.fromPersistenceDTO({
      uuid: data.uuid,
      key: data.key,
      name: data.name,
      description: data.description,
      value_type: data.valueType,
      value: data.value,
      default_value: data.defaultValue,
      scope: data.scope,
      account_uuid: data.accountUuid,
      device_id: data.deviceId,
      group_uuid: data.groupUuid,
      validation: data.validation,
      ui: data.ui,
      is_encrypted: data.isEncrypted,
      is_read_only: data.isReadOnly,
      is_system_setting: data.isSystemSetting,
      sync_config: data.syncConfig,
      history: data.historyData || '[]',
      created_at: data.createdAt.getTime(),
      updated_at: data.updatedAt.getTime(),
      deleted_at: data.deletedAt?.getTime() ?? null,
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

    await this.prisma.$transaction(async (tx) => {
      await tx.setting.upsert({
        where: { uuid: persistence.uuid },
        create: {
          uuid: persistence.uuid,
          key: persistence.key,
          name: persistence.name,
          description: persistence.description,
          valueType: persistence.value_type,
          value: persistence.value,
          defaultValue: persistence.default_value,
          scope: persistence.scope,
          accountUuid: persistence.account_uuid,
          deviceId: persistence.device_id,
          groupUuid: persistence.group_uuid,
          validation: persistence.validation,
          ui: persistence.ui,
          isEncrypted: persistence.is_encrypted,
          isReadOnly: persistence.is_read_only,
          isSystemSetting: persistence.is_system_setting,
          syncConfig: persistence.sync_config,
          historyData: persistence.history,
          createdAt: this.toDate(persistence.created_at) ?? new Date(),
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          deletedAt: this.toDate(persistence.deleted_at),
        },
        update: {
          name: persistence.name,
          description: persistence.description,
          valueType: persistence.value_type,
          value: persistence.value,
          defaultValue: persistence.default_value,
          scope: persistence.scope,
          accountUuid: persistence.account_uuid,
          deviceId: persistence.device_id,
          groupUuid: persistence.group_uuid,
          validation: persistence.validation,
          ui: persistence.ui,
          isEncrypted: persistence.is_encrypted,
          isReadOnly: persistence.is_read_only,
          isSystemSetting: persistence.is_system_setting,
          syncConfig: persistence.sync_config,
          historyData: persistence.history,
          updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
          deletedAt: this.toDate(persistence.deleted_at),
        },
      });
    });
  }

  async findById(uuid: string, options?: { includeHistory?: boolean }): Promise<Setting | null> {
    const data = await this.prisma.setting.findUnique({
      where: { uuid },
    });
    return data ? this.mapSettingToEntity(data) : null;
  }

  async findByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<Setting | null> {
    const where: any = { key, scope, deletedAt: null };
    if (scope === 'USER' && contextUuid) where.accountUuid = contextUuid;
    if (scope === 'DEVICE' && contextUuid) where.deviceId = contextUuid;

    const data = await this.prisma.setting.findFirst({ where });
    return data ? this.mapSettingToEntity(data) : null;
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
    return data.map((item) => this.mapSettingToEntity(item));
  }

  async findByGroup(groupUuid: string, options?: { includeHistory?: boolean }): Promise<Setting[]> {
    const data = await this.prisma.setting.findMany({
      where: { groupUuid, deletedAt: null },
    });
    return data.map((item) => this.mapSettingToEntity(item));
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

  async delete(uuid: string): Promise<void> {
    await this.prisma.setting.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    });
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
    await this.prisma.$transaction(async (tx) => {
      for (const setting of settings) {
        const persistence = setting.toPersistenceDTO();
        await tx.setting.upsert({
          where: { uuid: persistence.uuid },
          create: {
            uuid: persistence.uuid,
            key: persistence.key,
            name: persistence.name,
            description: persistence.description,
            valueType: persistence.value_type,
            value: persistence.value,
            defaultValue: persistence.default_value,
            scope: persistence.scope,
            accountUuid: persistence.account_uuid,
            deviceId: persistence.device_id,
            groupUuid: persistence.group_uuid,
            validation: persistence.validation,
            ui: persistence.ui,
            isEncrypted: persistence.is_encrypted,
            isReadOnly: persistence.is_read_only,
            isSystemSetting: persistence.is_system_setting,
            syncConfig: persistence.sync_config,
            historyData: persistence.history,
            createdAt: this.toDate(persistence.created_at) ?? new Date(),
            updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
            deletedAt: this.toDate(persistence.deleted_at),
          },
          update: {
            name: persistence.name,
            description: persistence.description,
            valueType: persistence.value_type,
            value: persistence.value,
            defaultValue: persistence.default_value,
            scope: persistence.scope,
            accountUuid: persistence.account_uuid,
            deviceId: persistence.device_id,
            groupUuid: persistence.group_uuid,
            validation: persistence.validation,
            ui: persistence.ui,
            isEncrypted: persistence.is_encrypted,
            isReadOnly: persistence.is_read_only,
            isSystemSetting: persistence.is_system_setting,
            syncConfig: persistence.sync_config,
            historyData: persistence.history,
            updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
            deletedAt: this.toDate(persistence.deleted_at),
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
    return data.map((item) => this.mapSettingToEntity(item));
  }
}
