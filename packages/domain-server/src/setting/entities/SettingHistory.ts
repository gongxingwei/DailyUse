/**
 * SettingHistory 实体实现
 * 实现 SettingHistoryServer 接口
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import type { SettingContracts } from '@dailyuse/contracts';

type ISettingHistoryServer = SettingContracts.SettingHistoryServer;
type SettingHistoryServerDTO = SettingContracts.SettingHistoryServerDTO;
type SettingHistoryPersistenceDTO = SettingContracts.SettingHistoryPersistenceDTO;

/**
 * SettingHistory 实体
 * 设置变更历史记录
 */
export class SettingHistory extends Entity implements ISettingHistoryServer {
  public readonly settingUuid: string;
  public readonly settingKey: string;
  public readonly oldValue: any;
  public readonly newValue: any;
  public readonly operatorUuid?: string | null;
  public readonly operatorType: 'USER' | 'SYSTEM' | 'API';
  public readonly createdAt: number;

  private constructor(params: {
    uuid?: string;
    settingUuid: string;
    settingKey: string;
    oldValue: any;
    newValue: any;
    operatorUuid?: string | null;
    operatorType: 'USER' | 'SYSTEM' | 'API';
    createdAt: number;
  }) {
    super(params.uuid ?? generateUUID());
    this.settingUuid = params.settingUuid;
    this.settingKey = params.settingKey;
    this.oldValue = params.oldValue;
    this.newValue = params.newValue;
    this.operatorUuid = params.operatorUuid ?? null;
    this.operatorType = params.operatorType;
    this.createdAt = params.createdAt;
  }

  /**
   * 创建新的 SettingHistory
   */
  public static create(params: {
    settingUuid: string;
    settingKey: string;
    oldValue: any;
    newValue: any;
    operatorUuid?: string;
    operatorType: 'USER' | 'SYSTEM' | 'API';
  }): SettingHistory {
    if (!params.settingUuid) {
      throw new Error('SettingUuid is required');
    }
    if (!params.settingKey) {
      throw new Error('SettingKey is required');
    }

    return new SettingHistory({
      settingUuid: params.settingUuid,
      settingKey: params.settingKey,
      oldValue: params.oldValue,
      newValue: params.newValue,
      operatorUuid: params.operatorUuid,
      operatorType: params.operatorType,
      createdAt: Date.now(),
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  public static fromServerDTO(dto: SettingHistoryServerDTO): SettingHistory {
    return new SettingHistory({
      uuid: dto.uuid,
      settingUuid: dto.settingUuid,
      settingKey: dto.settingKey,
      oldValue: dto.oldValue,
      newValue: dto.newValue,
      operatorUuid: dto.operatorUuid,
      operatorType: dto.operatorType,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  public static fromPersistenceDTO(dto: SettingHistoryPersistenceDTO): SettingHistory {
    return new SettingHistory({
      uuid: dto.uuid,
      settingUuid: dto.setting_uuid,
      settingKey: dto.setting_key,
      oldValue: JSON.parse(dto.old_value),
      newValue: JSON.parse(dto.new_value),
      operatorUuid: dto.operator_uuid,
      operatorType: dto.operator_type,
      createdAt: dto.created_at,
    });
  }

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): SettingHistoryServerDTO {
    return {
      uuid: this.uuid,
      settingUuid: this.settingUuid,
      settingKey: this.settingKey,
      oldValue: this.oldValue,
      newValue: this.newValue,
      operatorUuid: this.operatorUuid,
      operatorType: this.operatorType,
      createdAt: this.createdAt,
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): SettingHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      setting_uuid: this.settingUuid,
      setting_key: this.settingKey,
      old_value: JSON.stringify(this.oldValue),
      new_value: JSON.stringify(this.newValue),
      operator_uuid: this.operatorUuid,
      operator_type: this.operatorType,
      created_at: this.createdAt,
    };
  }
}
