/**
 * Setting Value Application Service
 * 设置值应用服务
 */

import { SettingContracts } from '@dailyuse/contracts';
import { PrismaSettingValueRepository } from '../../infrastructure/repositories/prisma/PrismaSettingValueRepository';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// 使用仓储定义的接口
interface ISettingValue {
  uuid: string;
  settingKey: string;
  value: any;
  scope: 'global' | 'user' | 'workspace' | 'session';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SettingValueApplicationService {
  private readonly repository: PrismaSettingValueRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new PrismaSettingValueRepository(prisma);
  }

  // ===== 基本 CRUD 操作 =====

  async getById(uuid: string): Promise<ISettingValue | null> {
    return await this.repository.findById(uuid);
  }

  async getAllByAccount(accountUuid: string): Promise<ISettingValue[]> {
    return await this.repository.findByAccountUuid(accountUuid);
  }

  async getByScope(
    accountUuid: string,
    scope: 'global' | 'user' | 'workspace' | 'session',
  ): Promise<ISettingValue[]> {
    return await this.repository.findByScope(accountUuid, scope);
  }

  async getByKey(accountUuid: string, key: string): Promise<ISettingValue | null> {
    const allSettings = await this.repository.findByAccountUuid(accountUuid);
    return allSettings.find((s) => s.settingKey === key) || null;
  }

  async create(
    accountUuid: string,
    key: string,
    value: any,
    scope: 'global' | 'user' | 'workspace' | 'session' = 'user',
  ): Promise<string> {
    const uuid = randomUUID();

    const settingValue: ISettingValue = {
      uuid,
      settingKey: key,
      value,
      scope,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.save(accountUuid, settingValue);
    return uuid;
  }

  async update(
    accountUuid: string,
    key: string,
    value: any,
    scope?: 'global' | 'user' | 'workspace' | 'session',
  ): Promise<void> {
    const existing = await this.getByKey(accountUuid, key);

    if (existing) {
      // 更新现有设置
      const updatedSetting: ISettingValue = {
        ...existing,
        value,
        scope: scope || existing.scope,
        updatedAt: new Date(),
      };
      await this.repository.save(accountUuid, updatedSetting);
    } else {
      // 创建新设置
      await this.create(accountUuid, key, value, scope || 'user');
    }
  }

  async delete(uuid: string): Promise<void> {
    await this.repository.delete(uuid);
  }

  async deleteByKey(accountUuid: string, key: string): Promise<void> {
    const setting = await this.getByKey(accountUuid, key);
    if (setting) {
      await this.repository.delete(setting.uuid);
    }
  }

  // ===== 查询操作 =====

  async getKeys(
    accountUuid: string,
    scope?: 'global' | 'user' | 'workspace' | 'session',
  ): Promise<string[]> {
    const settings = scope
      ? await this.repository.findByScope(accountUuid, scope)
      : await this.repository.findByAccountUuid(accountUuid);

    return settings.map((s) => s.settingKey);
  }

  async getScopes(accountUuid: string): Promise<string[]> {
    const settings = await this.repository.findByAccountUuid(accountUuid);
    const scopes = [...new Set(settings.map((s) => s.scope))];
    return scopes;
  }

  // ===== 批量操作 =====

  async batchSet(
    accountUuid: string,
    settings: Array<{
      key: string;
      value: any;
      scope?: 'global' | 'user' | 'workspace' | 'session';
    }>,
  ): Promise<void> {
    for (const setting of settings) {
      await this.update(accountUuid, setting.key, setting.value, setting.scope);
    }
  }

  async batchDelete(accountUuid: string, keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.deleteByKey(accountUuid, key);
    }
  }

  async batchDeleteByScope(
    accountUuid: string,
    scope: 'global' | 'user' | 'workspace' | 'session',
  ): Promise<void> {
    const settings = await this.repository.findByScope(accountUuid, scope);
    for (const setting of settings) {
      await this.repository.delete(setting.uuid);
    }
  }

  // ===== 导入导出操作 =====

  async exportSettings(
    accountUuid: string,
    scope?: 'global' | 'user' | 'workspace' | 'session',
  ): Promise<Record<string, any>> {
    return await this.repository.exportSettings(accountUuid);
  }

  async importSettings(accountUuid: string, settings: Record<string, any>): Promise<void> {
    await this.repository.importSettings(accountUuid, settings);
  }

  // ===== 业务逻辑方法 =====

  async exists(accountUuid: string, key: string): Promise<boolean> {
    const setting = await this.getByKey(accountUuid, key);
    return setting !== null;
  }

  async getWithDefault<T>(
    accountUuid: string,
    key: string,
    defaultValue: T,
    scope?: 'global' | 'user' | 'workspace' | 'session',
  ): Promise<T> {
    const setting = await this.getByKey(accountUuid, key);
    return setting ? (setting.value as T) : defaultValue;
  }

  async setIfNotExists(
    accountUuid: string,
    key: string,
    value: any,
    scope: 'global' | 'user' | 'workspace' | 'session' = 'user',
  ): Promise<boolean> {
    const exists = await this.exists(accountUuid, key);
    if (!exists) {
      await this.create(accountUuid, key, value, scope);
      return true;
    }
    return false;
  }

  async increment(accountUuid: string, key: string, delta: number = 1): Promise<number> {
    const current = await this.getWithDefault(accountUuid, key, 0);
    const newValue = (typeof current === 'number' ? current : 0) + delta;
    await this.update(accountUuid, key, newValue);
    return newValue;
  }

  async toggle(accountUuid: string, key: string): Promise<boolean> {
    const current = await this.getWithDefault(accountUuid, key, false);
    const newValue = !current;
    await this.update(accountUuid, key, newValue);
    return newValue;
  }

  // ===== 类型安全的设置访问方法 =====

  async getString(accountUuid: string, key: string, defaultValue: string = ''): Promise<string> {
    return await this.getWithDefault(accountUuid, key, defaultValue);
  }

  async getNumber(accountUuid: string, key: string, defaultValue: number = 0): Promise<number> {
    return await this.getWithDefault(accountUuid, key, defaultValue);
  }

  async getBoolean(
    accountUuid: string,
    key: string,
    defaultValue: boolean = false,
  ): Promise<boolean> {
    return await this.getWithDefault(accountUuid, key, defaultValue);
  }

  async getObject<T>(accountUuid: string, key: string, defaultValue: T = {} as T): Promise<T> {
    return await this.getWithDefault(accountUuid, key, defaultValue);
  }

  async getArray<T>(accountUuid: string, key: string, defaultValue: T[] = []): Promise<T[]> {
    return await this.getWithDefault(accountUuid, key, defaultValue);
  }

  // ===== 配置管理方法 =====

  async getAppConfig(accountUuid: string): Promise<Record<string, any>> {
    const settings = await this.repository.findByScope(accountUuid, 'global');
    const config: Record<string, any> = {};
    for (const setting of settings) {
      config[setting.settingKey] = setting.value;
    }
    return config;
  }

  async getUserPreferences(accountUuid: string): Promise<Record<string, any>> {
    const settings = await this.repository.findByScope(accountUuid, 'user');
    const prefs: Record<string, any> = {};
    for (const setting of settings) {
      prefs[setting.settingKey] = setting.value;
    }
    return prefs;
  }

  async resetToDefaults(
    accountUuid: string,
    scope?: 'global' | 'user' | 'workspace' | 'session',
  ): Promise<void> {
    if (scope) {
      await this.batchDeleteByScope(accountUuid, scope);
    } else {
      // 重置所有非系统设置
      const allSettings = await this.repository.findByAccountUuid(accountUuid);
      const settingsToDelete = allSettings.filter(
        (s) => !s.settingKey.startsWith('system.') && !s.settingKey.startsWith('account.'),
      );

      for (const setting of settingsToDelete) {
        await this.repository.delete(setting.uuid);
      }
    }
  }
}
