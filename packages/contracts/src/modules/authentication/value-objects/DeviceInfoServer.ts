/**
 * DeviceInfo Value Object - Server Interface
 * 设备信息值对象 - 服务端接口
 */

// ============ DTO 定义 ============

/**
 * DeviceInfo Server DTO
 */
export interface DeviceInfoServerDTO {
  deviceId: string;
  deviceFingerprint: string;
  deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
  deviceName?: string | null;
  os?: string | null;
  browser?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  firstSeenAt: number;
  lastSeenAt: number;
}

// ============ 值对象接口 ============

export interface DeviceInfoServer {
  deviceId: string;
  deviceFingerprint: string;
  deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
  deviceName?: string | null;
  os?: string | null;
  browser?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  firstSeenAt: number;
  lastSeenAt: number;

  updateLastSeen(): DeviceInfoServer;
  updateName(name: string): DeviceInfoServer;
  updateIpAddress(ipAddress: string): DeviceInfoServer;
  matchesFingerprint(fingerprint: string): boolean;

  toServerDTO(): DeviceInfoServerDTO;
}

export interface DeviceInfoServerStatic {
  create(params: {
    deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
    os?: string;
    browser?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): DeviceInfoServer;
  fromServerDTO(dto: DeviceInfoServerDTO): DeviceInfoServer;
}
