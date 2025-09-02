/**
 * 设备信息类型
 */
export type ClientInfo = {
  deviceId: string;
  deviceName: string;
  userAgent: string;
  ipAddress?: string;
};