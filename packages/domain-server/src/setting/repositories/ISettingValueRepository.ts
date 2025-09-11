/**
 * Setting Value Repository Interface
 * 设置值仓储接口
 */

// 简化的设置值接口（因为Setting模块contracts可能还需要完善）
interface ISettingValue {
  uuid: string;
  settingKey: string;
  value: any;
  scope: 'global' | 'user' | 'workspace' | 'session';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingValueRepository {
  // 基本 CRUD 操作
  findById(uuid: string): Promise<ISettingValue | null>;
  findByAccountUuid(accountUuid: string): Promise<ISettingValue[]>;
  findBySettingKey(accountUuid: string, settingKey: string): Promise<ISettingValue | null>;
  save(accountUuid: string, settingValue: ISettingValue): Promise<void>;
  update(uuid: string, value: any): Promise<void>;
  delete(uuid: string): Promise<void>;

  // 设置操作
  setSetting(accountUuid: string, settingKey: string, value: any, scope?: string): Promise<void>;
  getSetting(accountUuid: string, settingKey: string): Promise<any>;
  deleteSetting(accountUuid: string, settingKey: string): Promise<void>;
  resetToDefault(accountUuid: string, settingKey: string): Promise<void>;

  // 范围查询
  findByScope(accountUuid: string, scope: string): Promise<ISettingValue[]>;
  findGlobalSettings(): Promise<ISettingValue[]>;
  findUserSettings(accountUuid: string): Promise<ISettingValue[]>;

  // 批量操作
  batchSetSettings(accountUuid: string, settings: Record<string, any>): Promise<void>;
  batchDeleteSettings(accountUuid: string, settingKeys: string[]): Promise<void>;

  // 统计操作
  getTotalCount(accountUuid: string): Promise<number>;
  getCountByScope(accountUuid: string): Promise<Record<string, number>>;

  // 导入导出
  exportSettings(accountUuid: string): Promise<Record<string, any>>;
  importSettings(accountUuid: string, settings: Record<string, any>): Promise<void>;
}
