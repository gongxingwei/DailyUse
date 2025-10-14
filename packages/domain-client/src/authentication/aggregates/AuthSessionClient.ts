/**
 * AuthSession Aggregate Root - Client Implementation
 * 会话聚合根 - 客户端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';
import { RefreshTokenClient } from '../entities/RefreshTokenClient';
import { DeviceInfoClient } from '../value-objects/DeviceInfoClient';
import { SessionHistoryClient } from '../entities/SessionHistoryClient';

type SessionStatus = AuthC.SessionStatus;
const SessionStatus = AuthC.SessionStatus;

export class AuthSessionClient extends AggregateRoot implements AuthC.AuthSessionClient {
  constructor(
    uuid: string,
    public readonly accountUuid: string,
    public readonly accessToken: string,
    public readonly accessTokenExpiresAt: number,
    public readonly refreshToken: RefreshTokenClient,
    public readonly device: DeviceInfoClient,
    public readonly status: SessionStatus,
    public readonly ipAddress: string,
    public readonly location:
      | {
          country?: string | null;
          region?: string | null;
          city?: string | null;
          timezone?: string | null;
        }
      | null
      | undefined,
    public readonly lastActivityAt: number,
    public readonly lastActivityType: string | null | undefined,
    public readonly history: SessionHistoryClient[],
    public readonly createdAt: number,
    public readonly expiresAt: number,
    public readonly revokedAt: number | null | undefined,
  ) {
    super(uuid);
  }

  // ========== UI 计算属性 ==========

  get statusText(): string {
    const map = {
      [SessionStatus.ACTIVE]: '活跃',
      [SessionStatus.EXPIRED]: '已过期',
      [SessionStatus.REVOKED]: '已撤销',
      [SessionStatus.LOCKED]: '已锁定',
    };
    return map[this.status];
  }

  get isActive(): boolean {
    return this.status === SessionStatus.ACTIVE && Date.now() < this.expiresAt;
  }

  get isExpired(): boolean {
    return this.status === SessionStatus.EXPIRED || Date.now() >= this.expiresAt;
  }

  get isRevoked(): boolean {
    return this.status === SessionStatus.REVOKED;
  }

  get isLocked(): boolean {
    return this.status === SessionStatus.LOCKED;
  }

  get locationText(): string {
    if (!this.location) return '未知位置';
    const parts = [this.location.country, this.location.region, this.location.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '未知位置';
  }

  get lastActivityText(): string {
    const diff = Date.now() - this.lastActivityAt;
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`;
    return new Date(this.lastActivityAt).toLocaleDateString('zh-CN');
  }

  get expiresInText(): string {
    if (this.isExpired) return '已过期';
    const diff = this.expiresAt - Date.now();
    if (diff < 60 * 1000) return '即将过期';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分钟后过期`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} 小时后过期`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天后过期`;
  }

  get sessionAge(): number {
    return Date.now() - this.createdAt;
  }

  get sessionAgeDays(): number {
    return Math.floor(this.sessionAge / (1000 * 60 * 60 * 24));
  }

  get isCurrentDevice(): boolean {
    // 简化版本，实际需要与当前设备指纹比对
    return this.device.lastSeenAt > Date.now() - 5 * 60 * 1000;
  }

  // ========== UI 方法 ==========

  getStatusBadge(): { text: string; variant: string; icon: string } {
    if (this.isActive) {
      return { text: '活跃', variant: 'success', icon: 'check-circle' };
    }
    if (this.isExpired) {
      return { text: '已过期', variant: 'warning', icon: 'clock' };
    }
    if (this.isRevoked) {
      return { text: '已撤销', variant: 'danger', icon: 'x-circle' };
    }
    return { text: '已锁定', variant: 'danger', icon: 'lock' };
  }

  getDeviceBadge(): { text: string; variant: string; icon: string } {
    return {
      text: this.device.displayName,
      variant: this.isCurrentDevice ? 'primary' : 'secondary',
      icon: this.device.getDeviceIcon(),
    };
  }

  // ========== 权限检查 ==========

  canRevoke(): boolean {
    return this.isActive;
  }

  canRefresh(): boolean {
    return this.isActive && !this.refreshToken.isExpired;
  }

  // ========== DTO 转换 ==========

  toClientDTO(): AuthC.AuthSessionClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      accessToken: this.accessToken,
      accessTokenExpiresAt: this.accessTokenExpiresAt,
      refreshToken: this.refreshToken,
      device: this.device,
      status: this.status,
      ipAddress: this.ipAddress,
      location: this.location ?? null,
      lastActivityAt: this.lastActivityAt,
      lastActivityType: this.lastActivityType ?? null,
      history: this.history,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      revokedAt: this.revokedAt ?? null,
    };
  }

  static fromClientDTO(dto: AuthC.AuthSessionClientDTO): AuthSessionClient {
    return new AuthSessionClient(
      dto.uuid,
      dto.accountUuid,
      dto.accessToken,
      dto.accessTokenExpiresAt,
      RefreshTokenClient.fromClientDTO(dto.refreshToken as AuthC.RefreshTokenClientDTO),
      DeviceInfoClient.fromClientDTO(dto.device as AuthC.DeviceInfoClientDTO),
      dto.status as SessionStatus,
      dto.ipAddress,
      dto.location,
      dto.lastActivityAt,
      dto.lastActivityType,
      dto.history.map((h) =>
        SessionHistoryClient.fromClientDTO(h as AuthC.SessionHistoryClientDTO),
      ),
      dto.createdAt,
      dto.expiresAt,
      dto.revokedAt,
    );
  }
}
