/**
 * UserThemePreference Entity
 * 用户主题偏好实体
 *
 * @description 用户的主题偏好配置，包括当前使用的主题、偏好模式等
 */

import type { ThemeContracts } from '@dailyuse/contracts';

type IUserThemePreference = ThemeContracts.IUserThemePreference;
type ThemeMode = ThemeContracts.ThemeMode;

export class UserThemePreference implements IUserThemePreference {
  uuid: string;
  accountUuid: string;
  currentThemeUuid: string;
  preferredMode: ThemeMode;
  autoSwitch: boolean;
  scheduleStart?: number;
  scheduleEnd?: number;
  createdAt: number;
  updatedAt: number;

  constructor(props: IUserThemePreference) {
    this.uuid = props.uuid;
    this.accountUuid = props.accountUuid;
    this.currentThemeUuid = props.currentThemeUuid;
    this.preferredMode = props.preferredMode;
    this.autoSwitch = props.autoSwitch;
    this.scheduleStart = props.scheduleStart;
    this.scheduleEnd = props.scheduleEnd;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * 切换主题模式
   */
  switchMode(mode: ThemeMode): void {
    this.preferredMode = mode;
    this.updatedAt = Date.now();
  }

  /**
   * 设置当前主题
   */
  setCurrentTheme(themeUuid: string): void {
    this.currentThemeUuid = themeUuid;
    this.updatedAt = Date.now();
  }

  /**
   * 启用自动切换
   */
  enableAutoSwitch(scheduleStart?: number, scheduleEnd?: number): void {
    this.autoSwitch = true;
    if (scheduleStart !== undefined) this.scheduleStart = scheduleStart;
    if (scheduleEnd !== undefined) this.scheduleEnd = scheduleEnd;
    this.updatedAt = Date.now();
  }

  /**
   * 禁用自动切换
   */
  disableAutoSwitch(): void {
    this.autoSwitch = false;
    this.updatedAt = Date.now();
  }

  /**
   * 检查当前时间是否需要切换主题
   */
  shouldSwitchTheme(): boolean {
    if (!this.autoSwitch || !this.scheduleStart || !this.scheduleEnd) {
      return false;
    }

    const currentHour = new Date().getHours();

    // 如果开始时间 < 结束时间，比如 6:00 - 18:00
    if (this.scheduleStart < this.scheduleEnd) {
      return currentHour >= this.scheduleStart && currentHour < this.scheduleEnd;
    }

    // 如果开始时间 > 结束时间，比如 18:00 - 6:00（跨天）
    return currentHour >= this.scheduleStart || currentHour < this.scheduleEnd;
  }

  /**
   * 转换为纯对象（用于序列化）
   */
  toObject(): IUserThemePreference {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      currentThemeUuid: this.currentThemeUuid,
      preferredMode: this.preferredMode,
      autoSwitch: this.autoSwitch,
      scheduleStart: this.scheduleStart,
      scheduleEnd: this.scheduleEnd,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
