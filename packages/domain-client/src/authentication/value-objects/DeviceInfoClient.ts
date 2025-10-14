/**
 * DeviceInfo Value Object - Client Implementation
 * 设备信息值对象 - 客户端实现
 */

import { ValueObject } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';

type DeviceType = AuthC.DeviceType;
const DeviceType = AuthC.DeviceType;

/**
 * 设备信息值对象客户端实现
 */
export class DeviceInfoClient extends ValueObject implements AuthC.DeviceInfoClient {
  constructor(
    public readonly deviceId: string,
    public readonly deviceFingerprint: string,
    public readonly deviceType: DeviceType,
    public readonly deviceName: string | null | undefined,
    public readonly os: string | null | undefined,
    public readonly browser: string | null | undefined,
    public readonly ipAddress: string | null | undefined,
    public readonly location:
      | {
          country?: string | null;
          region?: string | null;
          city?: string | null;
          timezone?: string | null;
        }
      | null
      | undefined,
    public readonly firstSeenAt: number,
    public readonly lastSeenAt: number,
  ) {
    super();
  }

  // ========== UI 计算属性 ==========

  /**
   * 获取设备类型显示文本
   */
  get deviceTypeText(): string {
    const typeMap = {
      [DeviceType.BROWSER]: '浏览器',
      [DeviceType.DESKTOP]: '桌面应用',
      [DeviceType.MOBILE]: '移动设备',
      [DeviceType.TABLET]: '平板设备',
      [DeviceType.API]: 'API',
      [DeviceType.UNKNOWN]: '未知设备',
    };
    return typeMap[this.deviceType];
  }

  /**
   * 获取设备名称显示文本
   */
  get displayName(): string {
    if (this.deviceName) {
      return this.deviceName;
    }
    return this.deviceTypeText;
  }

  /**
   * 获取系统信息显示文本
   */
  get osText(): string {
    return this.os || '未知系统';
  }

  /**
   * 获取浏览器显示文本
   */
  get browserText(): string {
    return this.browser || '-';
  }

  /**
   * 获取位置显示文本
   */
  get locationText(): string {
    if (!this.location) {
      return '未知位置';
    }
    const parts = [this.location.country, this.location.region, this.location.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '未知位置';
  }

  /**
   * 获取IP地址显示文本
   */
  get ipAddressText(): string {
    return this.ipAddress || '-';
  }

  /**
   * 获取最后活跃时间显示文本
   */
  get lastSeenText(): string {
    const date = new Date(this.lastSeenAt);
    const now = Date.now();
    const diff = now - this.lastSeenAt;

    if (diff < 60 * 1000) {
      return '刚刚';
    }
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))} 分钟前`;
    }
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`;
    }
    return date.toLocaleDateString('zh-CN');
  }

  /**
   * 是否为移动设备
   */
  get isMobile(): boolean {
    return this.deviceType === DeviceType.MOBILE || this.deviceType === DeviceType.TABLET;
  }

  /**
   * 是否为桌面设备
   */
  get isDesktop(): boolean {
    return this.deviceType === DeviceType.DESKTOP || this.deviceType === DeviceType.BROWSER;
  }

  // ========== UI 方法 ==========

  /**
   * 获取设备类型图标
   */
  getDeviceIcon(): string {
    const iconMap = {
      [DeviceType.BROWSER]: 'globe',
      [DeviceType.DESKTOP]: 'monitor',
      [DeviceType.MOBILE]: 'smartphone',
      [DeviceType.TABLET]: 'tablet',
      [DeviceType.API]: 'code',
      [DeviceType.UNKNOWN]: 'help-circle',
    };
    return iconMap[this.deviceType];
  }

  // ========== ValueObject 实现 ==========

  equals(other: DeviceInfoClient): boolean {
    if (!(other instanceof DeviceInfoClient)) {
      return false;
    }
    return (
      this.deviceId === other.deviceId &&
      this.deviceFingerprint === other.deviceFingerprint &&
      this.deviceType === other.deviceType
    );
  }

  // ========== DTO 转换 ==========

  toClientDTO(): AuthC.DeviceInfoClientDTO {
    return {
      deviceId: this.deviceId,
      deviceFingerprint: this.deviceFingerprint,
      deviceType: this.deviceType,
      deviceName: this.deviceName ?? null,
      os: this.os ?? null,
      browser: this.browser ?? null,
      ipAddress: this.ipAddress ?? null,
      location: this.location ?? null,
      firstSeenAt: this.firstSeenAt,
      lastSeenAt: this.lastSeenAt,
    };
  }

  static fromClientDTO(dto: AuthC.DeviceInfoClientDTO): DeviceInfoClient {
    return new DeviceInfoClient(
      dto.deviceId,
      dto.deviceFingerprint,
      dto.deviceType as DeviceType,
      dto.deviceName,
      dto.os,
      dto.browser,
      dto.ipAddress,
      dto.location,
      dto.firstSeenAt,
      dto.lastSeenAt,
    );
  }
}
