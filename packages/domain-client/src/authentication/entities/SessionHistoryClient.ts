/**
 * SessionHistory Entity - Client Implementation
 */

import { Entity } from '@dailyuse/utils';
import { AuthenticationContracts as AuthC } from '@dailyuse/contracts';

export class SessionHistoryClient extends Entity implements AuthC.SessionHistoryClient {
  constructor(
    uuid: string,
    public readonly sessionUuid: string,
    public readonly action: string,
    public readonly details: any | null | undefined,
    public readonly ipAddress: string | null | undefined,
    public readonly userAgent: string | null | undefined,
    public readonly createdAt: number,
  ) {
    super(uuid);
  }

  get actionText(): string {
    const map: Record<string, string> = {
      'session.created': '创建会话',
      'session.refreshed': '刷新会话',
      'session.expired': '会话过期',
      'session.revoked': '撤销会话',
      'activity.login': '登录',
      'activity.logout': '登出',
    };
    return map[this.action] || this.action;
  }

  toClientDTO(): AuthC.SessionHistoryClientDTO {
    return {
      uuid: this.uuid,
      sessionUuid: this.sessionUuid,
      action: this.action,
      details: this.details ?? null,
      ipAddress: this.ipAddress ?? null,
      userAgent: this.userAgent ?? null,
      createdAt: this.createdAt,
    };
  }

  static fromClientDTO(dto: AuthC.SessionHistoryClientDTO): SessionHistoryClient {
    return new SessionHistoryClient(
      dto.uuid,
      dto.sessionUuid,
      dto.action,
      dto.details,
      dto.ipAddress,
      dto.userAgent,
      dto.createdAt,
    );
  }
}
